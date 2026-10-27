# Informe de revision — TASK-066 (ronda 3)

- Commit revisado: 630e9eb188ba82b3d9ed6548122a33dcef0b47c4
- Revisor: code-quality-reviewer (agente revisor independiente ac5a86ab0df1396eb; clon propio en %LOCALAPPDATA%\pruebas-claude\taskcode\task-066-r3, ya borrado)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-7 | IMPORTANTE | corregido | test/commands/doctor-deploy.test.ts (el mutante `else if (false)` muere con 2 tests) | implementacion |
| MEN-4 | MENOR | corregido | src/fs/sondas-deploy.ts (gitignore por carpeta de proyecto; Go sin `require` no exige go.sum) | implementacion |
| MEN-9 | MENOR | corregido | src/core/secretos.ts + README (url-con-credenciales sin huella en texto, JSON e informe) | implementacion |
| MEN-10 | MENOR | corregido | src/commands/doctor-deploy.ts (aviso «exige silenciar_N_commit») | implementacion |
| MEN-11 | MENOR | corregido | test/commands/doctor-deploy.test.ts (M12 muere); M13 aceptado y documentado en el README | implementacion |
| MEN-7 | MENOR | aceptado | scripts/doctor-deploy.yml | plan |
| MEN-8 | MENOR | aceptado | src/core/doctor-deploy.ts resumir | plan |
| MEN-12 | MENOR | aceptado | src/fs/sondas-deploy.ts sondaGitignoreEnv: `.slice(0, 10)` da falso OK con mas de 10 proyectos | implementacion |
| MEN-13 | MENOR | aceptado | test/commands/doctor-deploy.test.ts: protecciones nuevas sin test (N4, N8, N9, N11, N12, N14, N17) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin CRITICOS ni IMPORTANTES abiertos. MEN-12 y MEN-13 se aceptan sin corregir en esta tarea (modo automatico: el codigo mergeado es el revisado) y pasan a TASK-067.

## Resultado de la reproduccion

- Suite (Git Bash, clon limpio en 630e9eb): 1528 tests, 1523 ok, 5 fallos, exactamente los 5 conocidos. Ningun test de doctor-deploy falla. `tsc` limpio.
- CLI real sobre repos Git temporales:
  - IMP-7: el test nuevo mata el mutante de la rama.
  - MEN-4 monorepo: `.gitignore` solo en `apps/web` con su `.env` -> OK nombrando `apps/web/.gitignore`; sin el -> FALLA nombrando `apps/web/.env`; dos proyectos y solo uno con `.gitignore` -> FALLA nombrando el otro; raiz con `docker-compose.yml` -> se comprueba tambien el `.env` de la raiz.
  - MEN-4 Go: solo `go.mod` -> OK «sin bloque require»; con `require` (linea o bloque) sin `go.sum` -> FALLA; con `go.sum` -> OK; comentario `// require nada` -> OK; `go.mod` en subcarpeta sin dependencias -> OK.
  - MEN-9: `postgres://admin:...@db.prod.acme.io/app` da FALLA en arbol e historial sin huella en texto, JSON e informe .md; `stripe-live` conserva la huella.
  - MEN-10: silencio solo con huella para un hallazgo del historial: sigue FALLA con el aviso «un hallazgo del historial exige silenciar_1_commit».
  - MEN-11: `core.excludesFile` con barras invertidas -> FALLA «solo lo cubre una regla local», sin comillas ni barras dobles repetidas.
- Fuga de secretos: ventana de 8 caracteres sobre la URL completa, la contrasena y `sk_live_...` en stdout, `--json`, `--escribir`, `--escribir --json`, informe .md y stderr: cero trozos en las 6 salidas.
- Mutantes (18 en los arreglos nuevos): mueren 12 (N1, N2, N3, N5, N6, N7, N10, N13, N15, N16, N18). Sobreviven 6, todos protecciones nuevas sin test: N4 (`catch` de `moduloGoConDependencias`, no provocable con Git real), N8 y N9 (aviso MEN-10 sin comprobar fichero o patron), N11 (`slice(0, 10)` a `slice(0, 1)`), N12 (se ignora el NO VERIFICADO de `check-ignore`), N14 (regex `require` sin ancla), N17 (la evidencia solo trae la primera carpeta).

### MEN-12 — Falso OK con mas de 10 proyectos
`sondaGitignoreEnv` recorta con `.sort().slice(0, 10)` sin avisar. Reproducido: monorepo con 12 carpetas `apps/aNN` con `package.json`, la 12 sin `.gitignore`: `ok | .env esta cubierto por un .gitignore en las 10 carpetas de proyecto`. Falso OK hacia lo inseguro. Correccion sugerida: comprobar todas o dar NO VERIFICADO con cuantas quedaron sin mirar.

### MEN-13 — Sin red para varias protecciones nuevas
- N8/N9: el aviso MEN-10 saltaria con cualquier silencio de arbol no usado si hay un hallazgo de historial en otra parte; falta un test con silencio de otro fichero.
- N12: si `check-ignore` falla en una carpeta, se pierde el NO VERIFICADO y el punto queda OK; aceptar documentado o forzarlo con un `cwd` inexistente.
- N14: un `// require` en comentario no deberia contar; correcto a mano, sin test.
- N17: no se prueba que la evidencia nombre todas las carpetas sin `.gitignore`.

## Notas
- Sin CRITICOS: ningun secreto se filtra y ningun camino llega a OK sin evidencia, salvo el recorte de MEN-12.
- Consecuencia asumida de MEN-9: una URL con credenciales en el arbol no se puede silenciar (hay que quitarla); documentado en el README.

## No verificado
Timeout real de una herramienta externa en Windows, salida real de `cargo audit`/`pip-audit`/`govulncheck`, un clon con mas de 200 000 blobs y la rama de `cat-file --batch` truncado.

## Comprobacion del repo original
`git status --short` vacio y `git log --oneline -1` = `2eb0ac2 chore(TASK-066): peticion de revision ronda 3`. Ningun commit, add ni escritura en el repo original. Clon borrado.
