# Informe de revision — TASK-085 (ronda 2)

- Commit revisado: 891ab503d2347ff0e9d14afd1e7740965b050141
- Revisor: agente general-purpose con code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-085 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

Sin hallazgos nuevos en esta ronda. Los dos MENOR de la ronda 1 quedan corregidos y verificados por mutacion:

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | test/commands/coste-automatico.test.ts (`cicloPorCli(true)`: red de finish) | implementacion |
| MEN-2 | MENOR | corregido | test/core/coste-automatico.test.ts (`volcado: crece el total pero algun campo baja...`) | implementacion |

Ningun CRITICO ni IMPORTANTE abierto. Las correcciones (commit 891ab50) son solo tests; `git diff 126d18d..891ab50 -- src` esta vacio.

## Reproduccion

**Entorno.** Clon nuevo en `pruebas-claude\taskcode\task-085-r2`, rama `feature/task-085-coste-de-implementacion-registrado-autom` (HEAD 2112251: solo anade peticion, informe y una linea de `tarea.md` sobre 891ab50). `npm install` y `npm run build` sin errores.

**Puerta determinista.**
- Lint (`tsc -p tsconfig.json --noEmit`): exit 0.
- Suite completa, una vez (`npm test`): 2004 tests, 2001 pass, 3 fail. Los tres son los rojos conocidos de Windows y ningun otro: symlink `EPERM` (approve), chmod sobre directorios en NTFS (plan, "Missing expected rejection") y CRLF (plan, rama base real).

**Tests objetivo, linea base** (los tres ficheros nuevos): 22 tests, 22 pass, 0 fail.

**Mutantes** sobre el JS compilado del clon; tras cada uno se restauro el fichero y se comprobo con `cmp`.

| Mutante | Resultado |
|---|---|
| MEN-2: `dist/src/core/coste-automatico.js:116`, `if (delta.tokens <= 0 \|\| CAMPOS.some(...))` pasa a `if (delta.tokens <= 0)` | muerto: 1 fallo ("volcado: crece el total pero algun campo baja..."). En la ronda 1 sobrevivia (M8). |
| MEN-1: `dist/src/commands/finish.js:521-522`, se quita `volcado.olvidar()` | muerto: 1 fallo ("ciclo por CLI: si review no lo vuelca, la red de finish lo suma una vez y vacia el libro"). En la ronda 1 sobrevivia (M15). |

**Revision de las correcciones.**
- `cicloPorCli(true)`: con `COSTE_AUTOMATICO=0` en review no hay fila ni suma y el libro sigue; finish suma 500 una sola vez, vacia el libro, deja `git status` limpio y el commit de cierre lleva la fila `| implementacion | sesion:`.
- `cicloPorCli(false)`: la extraccion a funcion conserva las aserciones originales (+500 en review, "finish no lo vuelve a sumar") y solo anade que el libro se vacia tras review. Ninguna expectativa cambiada en silencio.
- Test de core: `cacheLectura` sube y `salida` baja (delta -90) con tokens +500, asi que el guard de campos negativos es lo unico que bloquea.
- Repos Git temporales reales, sin dobles nuevos.

**Limpieza.** Clon y carpeta temporal borrados. `git status --porcelain` del repo original: vacio.

## Lecturas fuera del contexto permitido

- `informe-revision-1.md`: para seguir MEN-1 y MEN-2.
- `revision.md`, la skill `code-quality-reviewer` y la plantilla del informe: procedimiento y formato.
- `src/core/coste-automatico.ts` (via `dist/`, linea 116), `src/commands/finish.ts` y `src/commands/review.ts` (solo grep de `volcar`/`olvidar`): para localizar lo que mutan los mutantes.
