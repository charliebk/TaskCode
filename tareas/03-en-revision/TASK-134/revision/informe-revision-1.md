# Informe de revision — TASK-134 (ronda 1)

- Commit revisado: 01fe307a11bab6dce91df782585b0d71464b9c35
- Revisor: code-quality-reviewer (general-purpose, sonnet)
- Veredicto: aprobada con correcciones

Alcance: completa (primera ronda). Pase generico por descarte: TypeScript de Node sin revisor de dominio. `resolver-bash.ts` y `gitflow-runner.ts` a fondo, con reproduccion y mutacion; `doctor.ts`, solo el mensaje de la comprobacion `bash`.

## Que se ejecuto

- Puerta: la verificacion de la ronda (`node scripts/verificar-impacto.mjs`, 749 tests, 0 fallos) es del mismo commit revisado; se cita y no se repite.
- `npm run build` limpio; `dist/src` versionado identico al compilado.
- Tests afectados desde PowerShell (`resolver-bash`, `gitflow-runner`, `sonda-bash`, `doctor`): 50 tests, 48 pasan, 2 omitidos (MENOR-3).
- Reproduccion desde PowerShell con `$env:Path = "C:\Windows\System32;C:\Program Files\Git\cmd;C:\Program Files\nodejs"`: `taskctl doctor --json` da `bash` ok con "bash de Git: C:\Program Files\Git\usr\bin\bash.exe"; `taskctl diagnose` exit 0. Control: `bash -c "echo hola"` en esa terminal falla con el error de WSL (`execvpe(/bin/bash) failed`), el fallo que corrige la tarea.
- Mutaciones (cada una deshecha y recompilada): M1 resolver siempre al PATH, M3 un solo nivel, M4 `bin` antes que `usr\bin`, M5 sin quitar comillas, M6 clave PATH fija, M7 `lanzarBash` sin el entorno: todas rojas. M8 (`spawnSync('bash')` literal), M9 (error sin el nombre del bash) y M10 (doctor sin la frase de que bash usa) sobreviven.
- Casos borde del resolutor con un `existe` falso: mayusculas, `usr\bin` espurio por encima (gana la instalacion de Git), shims de scoop/chocolatey (respaldo al PATH, MENOR-4).

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MENOR-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/fs/gitflow-runner.test.ts | implementacion |
| MENOR-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor.test.ts | implementacion |
| MENOR-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/fs/sonda-bash.test.ts | implementacion |
| MENOR-4 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/core/resolver-bash.ts | plan |

**MENOR-1 — ningun test verifica que se lanza `bash.comando` ni que el error lo nombra.** M8 y M9 dejan 16/16 en verde: con `usr\bin` delante en el PATH del hijo, `bash` literal resuelve al mismo `usr\bin\bash.exe`, y el unico test de `GitflowScriptLaunchError` usaba el valor por defecto. Corregido (157a299) el del mensaje: test con la ruta del bash como tercer argumento (M9 ahora rojo). M8 sigue sin poder distinguirse mientras se anteponga `usr\bin`; queda anotado.

**MENOR-2 — el mensaje de doctor sobre que bash se usa no tiene test.** M10 deja 48/48 en verde. Corregido (157a299): en Windows, el caso sin bash en el PATH exige "no se encontro el bash de Git junto a git.exe" y un caso nuevo exige "; bash de Git: ...\usr\bin\bash.exe" (M10 ahora rojo).

**MENOR-3 — los tests de la sonda se omiten desde PowerShell.** `montarEntorno` buscaba la carpeta de bash en el PATH heredado; desde PowerShell no esta y los 2 tests se omitian. Corregido (157a299): la toma de `bashDeTaskctl().herramientas`; desde PowerShell, 10/10 sin omitidos.

**MENOR-4 — limites del resolutor: shims y entorno del llamante.** Con git por scoop o chocolatey el primer `git.exe` es un shim sin `usr\bin\bash.exe` cerca: respaldo al bash del PATH (comportamiento anterior, doctor lo dice). Y `bashDeTaskctl()` resuelve con `process.env` aunque un llamante pasara `env` propio (hoy ninguno lo hace). Aceptado sin corregir: ampliacion de alcance; va al backlog.

## Lecturas fuera del contexto permitido

- `skills/task-workflow/revision.md` del plugin instalado: lo exige la skill revisora.
- `test/commands/doctor.test.ts` (lineas 764-790) y `src/cli.ts` (655-680, `GitflowScriptLaunchError`): para MENOR-1, 2 y 4.
