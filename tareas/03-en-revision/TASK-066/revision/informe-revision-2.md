# Informe de revision — TASK-066 (ronda 2)

- Commit revisado: feea4ef2ddba7e21057c94766a074b992360ac4b
- Revisor: code-quality-reviewer (agente revisor independiente a9f73ad99de3bbdaa; clon propio en %LOCALAPPDATA%\pruebas-claude\taskcode\task-066-r2, ya borrado)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-066 aprobada | aprobada-con-correcciones | cambios-solicitados)

Incidencia: por un heredoc sin cerrar, el revisor ejecuto lineas en el repo original y dejo un commit `34ba054 "k"` (solo `config/prod.env.js` con una clave de prueba falsa) y un `.taskcode/doctor-deploy.yml` sin trackear en la rama de la tarea. No se subio. Con autorizacion de la persona se deshizo con `git reset --mixed 0178d59` y borrando ambos ficheros; el agente se detuvo.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/fs/deteccion-app.ts + src/fs/sondas-deploy.ts (ficheros-secretos usa git ls-files completo) | implementacion |
| IMP-2 | IMPORTANTE | corregido | src/fs/sondas-deploy.ts (arbol e historial ya no excluyen build/dist/vendor/target versionados) | plan |
| IMP-3 | IMPORTANTE | corregido | src/fs/sondas-deploy.ts decodificar (UTF-16 con BOM) | implementacion |
| IMP-4 | IMPORTANTE | corregido | src/fs/sondas-deploy.ts buscarSilencio + src/core/doctor-deploy-catalogo.ts (huella) | implementacion |
| IMP-5 | IMPORTANTE | corregido | src/fs/sondas-deploy.ts sondaGitignoreEnv (regla negada) | implementacion |
| IMP-6 | IMPORTANTE | corregido | test/commands/doctor-deploy.test.ts (M8, M12, M16 de la ronda 1 ya mueren) | implementacion |
| IMP-7 | IMPORTANTE | abierto | test/commands/doctor-deploy.test.ts (buscarSilencio: rama `else if (s.commit !== null) continue` sin test) | implementacion |
| MEN-1 | MENOR | corregido | src/fs/sondas-deploy.ts (>1 MiB = NO VERIFICADO) | plan |
| MEN-2 | MENOR | corregido | src/fs/sondas-deploy.ts (core.quotepath=false) | implementacion |
| MEN-3 | MENOR | corregido | src/commands/doctor-deploy.ts (excluye docs/doctor-deploy del status) | plan |
| MEN-4 | MENOR | abierto | src/fs/sondas-deploy.ts (requirements.txt corregido; siguen los falsos FALLA de monorepo y Go sin dependencias) | implementacion |
| MEN-5 | MENOR | corregido | src/commands/doctor-deploy.ts | implementacion |
| MEN-6 | MENOR | corregido | test/core/doctor-deploy.test.ts (sanearPunto) | implementacion |
| MEN-7 | MENOR | aceptado | scripts/doctor-deploy.yml (OWASP 2021; fijar version en tarea posterior) | plan |
| MEN-8 | MENOR | aceptado | src/core/doctor-deploy.ts resumir | plan |
| MEN-9 | MENOR | abierto | src/core/secretos.ts huellaDe + README:633 (la huella permite confirmar contrasenas debiles) | implementacion |
| MEN-10 | MENOR | abierto | src/core/doctor-deploy-catalogo.ts:~504 (huella sola aceptada para un hallazgo del historial que nunca casara) | implementacion |
| MEN-11 | MENOR | abierto | src/fs/sondas-deploy.ts (M12 y M13 sobreviven) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Resultado de la reproduccion

- Clon limpio, `npm install`, `npm test` desde Git Bash: 1522 tests, 1517 ok, 5 fallos, exactamente los 5 conocidos. Ningun test de doctor-deploy falla. `tsc` limpio.
- CLI real sobre ~25 repos temporales; todos los repros de la ronda 1 resueltos: `build/.env`/`vendor/.env`/`dist/id_rsa` FALLA; `git mv` a build/ FALLA en arbol e historial; UTF-16LE/BE con BOM FALLA; silencio sin commit ni huella aborta, con huella silencia solo esa clave y otra `sk_live_` en el mismo fichero FALLA; `!.env` FALLA y `.env.*` + `!.env.example` OK; secreto solo en etiqueta o en otra rama FALLA; 1 MiB OK y 1 MiB + 1 NO VERIFICADO; `contraseña.js` con nombre real y silenciable; `--escribir` dos veces sin «sucio»; `requirements.txt` sin `==` FALLA; `docs/doctor-deploy` como fichero imprime el analisis con `[AVISO]` y exit 0; excludesFile global con barras invertidas FALLA «solo lo cubre una regla local»; silenciar un commit de un blob presente en dos commits silencia solo ese.
- Secretos en la salida: 4 secretos distintos (sk_live, ghp_, AKIA, URL con contrasena), uno en UTF-16 y otro bajo build/: cero trozos de 8+ caracteres en stdout, `--json`, `--escribir --json`, informe .md y stderr. La huella nunca coincide con un trozo del valor.
- Mutantes (23): mueren M1-M11, M14-M16, M18-M21. Sobreviven M12, M13 y M17.

### IMP-7 — Sin test para «un silencio con commit no tapa el arbol»
`buscarSilencio`, rama `else if (s.commit !== null) { continue; }`: protege que un silencio pensado para el historial (con commit, sin huella) no tape una clave nueva en el arbol del mismo fichero. El codigo es correcto (a mano: K1 anadida y borrada, silenciada por commit; K2 en el arbol: arbol FALLA), pero el mutante M17 (`else if (false)`) sobrevive con 75 tests. Reabriria IMP-4 por la otra puerta. Sugerencia: test con silencio solo por commit y clave distinta en el arbol del mismo fichero y patron, que debe quedar FALLA.

### MEN-4 (parcial) — Siguen dos falsos FALLA de la ronda 1
Monorepo con `.gitignore` solo en `apps/web/`: FALLA en gitignore-cubre-env. Modulo Go solo con `go.mod` (sin dependencias): FALLA en lockfile-versionado. Fallan hacia lo seguro; corregir o documentar como limite aceptado.

### MEN-9 — La huella permite confirmar contrasenas debiles
SHA-256 sin sal del valor completo. Para `url-con-credenciales` (`scheme://usuario:contrasena@host`, usuario y host conocidos) un diccionario confirma la contrasena: reproducido con `postgres://admin:Hunter2pass@db.prod.acme.io`. El README dice que la huella «no revela la clave», falso para ese patron. Sugerencia: matizar el README, no mostrar huella para `url-con-credenciales`, o sal/HMAC.

### MEN-10 — Huella sola aceptada pero nunca casa con el historial
Con `silenciar_N_huella` sin commit, el parser acepta; un hallazgo del historial exige commit y sale un aviso generico de «no coincide». Sugerencia: avisar «un hallazgo del historial exige silenciar_N_commit».

### MEN-11 — Dos protecciones nuevas sin test
M12 (quitar comillas de la ruta de `excludesFile`): casi equivalente, solo cambia la ruta mostrada. M13 (`cat-file --batch` truncado): no se pudo provocar con Git real; aceptar documentado.

## Notas sobre las novedades declaradas
- Silencios del arbol atados a huella y aborto sin commit ni huella: correctos (salvo `fichero-secreto`, que se silencia por nombre; razonable).
- Cualquier blob grande en el historial da NO VERIFICADO: decision consciente y documentada; no es hallazgo.
- UTF-16 sin BOM cuenta como binario y la evidencia lo dice: aceptable.
- Sin CRITICOS: ningun secreto se filtra y ningun camino llega a OK sin evidencia.

## No verificado
Timeout real de una herramienta externa en Windows, salida real de `cargo audit`/`pip-audit`/`govulncheck`, un clon con mas de 200 000 blobs y la rama de M13.
