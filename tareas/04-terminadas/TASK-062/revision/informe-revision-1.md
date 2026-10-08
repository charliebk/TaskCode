# Informe de revision — TASK-062 (ronda 1)

- Commit revisado: f13346f52e95a9c83340c5022a8745731fd4e2fe
- Revisor: code-quality-reviewer
- Veredicto: aprobada con correcciones

Veredicto propuesto por el revisor: **aprobada-con-correcciones** (solo hay hallazgos MENORES; ninguno bloquea el cierre).

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md:19-27 y :125-126 |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts (comprobarConfig / runDoctorCommand) |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts (comprobarConfig) |
| MEN-4 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor.ts:26 |
| MEN-5 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_sonda-bash.sh (+ test/fs/gitflow-runner.test.ts) |

### MEN-1 — Parrafo duplicado en la skill y nota de `status` torpe
`skills/task-workflow/SKILL.md` lineas 19-27: el parrafo «Al empezar en un proyecto, ejecuta tambien `taskctl doctor`...» aparece DOS veces seguidas (el diff de la peticion lo muestra duplicado). Es una skill que se carga entera en cada contexto: ~480 bytes inutiles (14175 de 15360 permitidos; sin el duplicado, ~13,7 KB) y parece un error de edicion. Ningun test lo detecta. La linea 125-126 mete el inciso «(`status` no existe: ... `doctor` ... `board`)» en mitad de la frase «No inventar estos comandos (...): `status`, `list`...», que queda ilegible; mejor una frase aparte tras la lista. Reproduccion: `sed -n 19,27p skills/task-workflow/SKILL.md`. El criterio 9 SI se cumple en lo demas: la skill manda ejecutar doctor, no menciona TaskCode ni rutas internas y respeta el limite de tamano.
Arreglo: borrar uno de los dos parrafos y sacar la nota de `status` a su propia frase.

### MEN-2 — Con la config invalida, la rama base se comprueba contra `develop` y sale `ok`
Con `.taskcode/config.yml` = `rama_base: dev` + `modo_flujo: xx` (valor invalido), `comprobarConfig` devuelve `CONFIG_DEFAULTS`, asi que `rama-base` comprueba `develop` y da `[ok] existe la rama "develop"` cuando la rama base del proyecto es `dev`. Reproducido con `node bin/taskctl doctor` en un repo temporal. No es danino (el codigo de salida ya es 1 por el error de config y se arregla primero eso), pero es un OK sobre una rama que no es la configurada; igual con `cierre_por_defecto: merge-request` + otra clave invalida (origin baja a aviso, plataforma omitida). Sugerencia: marcar `rama-base`/`origin`/`plataforma` como omitidas («la config no se pudo leer») cuando `config` es error, o decir en el mensaje que se uso el valor por defecto.

### MEN-3 — Prefijo duplicado en los mensajes de config
Doctor antepone `[ERROR]`/`[AVISO]` y el mensaje del validador ya lleva el suyo: `[ERROR]   config: [ERROR] C:\t\s5\.taskcode\config.yml:1: cierre_por_defecto ...` y `[AVISO]   config-claves: [AVISO] C:\...`. Cosmetico; quitar el prefijo inicial del mensaje antes de `una(...)`. En `--json` el campo `mensaje` tambien lo lleva.

### MEN-4 — «Node 20 como minimo» no esta respaldado por nada ejecutable
No hay `engines` en `package.json`, el CI solo corre Node 22 y Node 20 esta fuera de soporte desde abril de 2026. `nodeSoportado` acepta `20.0`..`20.10` aunque el comentario justifica el 20 por `import.meta.dirname` (20.11, y solo en tests). Decision razonable pero no verificada (el plan ya lo dejaba como hueco). Sugerencia: declarar `engines.node` en `package.json` con el mismo valor (o subir el minimo a 22, el unico probado) para que haya una sola fuente.

### MEN-5 — La sonda real no tiene test que falle cuando faltan herramientas (mutante superviviente)
Mutante: en `_sonda-bash.sh` sustituir `tmp=$(mktemp -d)` por `tmp=$(dirname "$0")` (y quitar el `trap`), de modo que la sonda ya no prueba `mktemp`: `doctor.test.js` y `gitflow-runner.test.js` siguen en verde (48/48). Los tests de fallo usan scripts de sonda falsos y el test del script real solo asevera «OK en esta maquina». Lo que la sonda realmente detecta (bash de Git sin `usr\bin`) solo se verifico a mano (ver abajo). Limitacion razonable (necesita manipular el PATH), por eso MENOR; un test que lance la sonda real con un PATH reducido a un directorio con solo `bash` la cerraria. Anotacion secundaria: el `git status` de doctor con timeout de 15 s (ETIMEDOUT) se reporta como `error` («git status fallo»), no como aviso; irrelevante salvo repos enormes.

## Reproduccion empirica (CLI real, `node bin/taskctl doctor [--json]`, repos temporales reales)

- Proyecto completo: 12 ok + 1 aviso (sin origin) + 1 omitida, codigo 0; `--json` valido, una sola linea, stderr vacio.
- Recien inicializado sin commits: `repo-commits` error con mensaje propio y arreglo; ramas omitidas; codigo 1. Sin `tareas/`: error con el `mkdir -p` exacto. Sin `develop`: error con `git branch develop main`. Fuera de un repo: error y el resto omitido, sin excepcion.
- Sin origin: aviso, codigo 0; con `cierre_por_defecto: merge-request`: error, codigo 1 (plataforma omitida).
- Config con valor invalido: error con el mensaje del validador; con clave desconocida: aviso que la nombra (y no escribe en stderr).
- Tarea en carpeta equivocada, ID duplicado (dos errores: estado y duplicado), `tarea.md` roto (ruta y causa), carpeta sin `tarea.md`, `id` distinto de la carpeta, `tarea.md` con CRLF (ok): todos como se espera, con el ID y el arreglo.
- Worktree enlazado: ok. Workspace sucio: aviso, codigo 0.
- Solo lectura: `git status --porcelain`, HEAD y `.git/index` (mtime, incluso en estado «racily clean» tras un commit reciente) identicos antes y despues de doctor. Ojo al medir: el `git status` del propio medidor reescribe el indice; doctor no.
- `--json` con errores: codigo 1, stdout = un unico objeto JSON valido, stderr vacio. Flag desconocido y argumento sobrante: error de uso por stderr, codigo 1.
- Bash en Windows (PATH reducido, PowerShell): con `C:\Windows\System32` (WSL) primero: ERROR con el mensaje de WSL («execvpe(/bin/bash) failed») y arreglo que dice anteponer `Git\usr\bin` al PATH; sin ningun bash: ERROR `spawnSync bash ENOENT`; un `bash.exe` de Git copiado SIN las herramientas: ERROR `mktemp: command not found` con el arreglo. Con `Git\bin` (lanzador que ya anade usr\bin) y con `Git\usr\bin`: ok, y es cierto (los scripts correrian). Ningun OK falso.
- Plataforma con el doble de `test/helpers/plataforma-doble.ts` y origin con `usuario:secreto@` en la URL: con sesion ok (solo `auth status`), sin sesion error, colgado (timeout 1,5 s) aviso, no instalado error (`spawnSync gh ENOENT`); sin credenciales en texto ni en JSON.
- Refactors: `finish` no cambia — el diff no toca ningun test de finish, los de `finish-merge-request` estan en la suite verde y los textos de `resolverRemotoDeOrigin` son los de siempre.
- Skill y README: la skill no menciona TaskCode ni rutas internas (el README del plugin ya mencionaba el proyecto antes de este diff) y SKILL.md pesa 14175 bytes (limite 15360).

## Puerta determinista

- `npm install` + `npm run build`: `git status` limpio salvo `package-lock.json` (lo toca `npm install`, no la rama); `dist/src` coincide con `src`.
- `npm test` completo, UNA vez: **1343 tests, 1340 pasan, 3 fallan** — exactamente los 3 conocidos de Windows: `approve ... stat que NO sea ENOENT` (#109), `plan ... escritura que NO sea EEXIST` (#450), `plan ... rama base real ... estado distinto` (#456). Sin otros rojos (los EBUSY del log son de teardown).

## Mutacion (doctor.test.js + core/doctor.test.js; --test-timeout=500000)

| Mutante | Resultado |
|---|---|
| `commands/doctor.ts`: quitar `GIT_OPTIONAL_LOCKS=0` | rojo: test 23 «solo lee» |
| `commands/doctor.ts`: desactivar deteccion de ID duplicado | rojo: test 18 |
| `fs/merge-request.ts`: `noVerificable` siempre false | rojo: test 39 (timeout debe ser aviso) |
| `commands/doctor.ts`: origin ausente nunca es error | rojo: test 9 |
| `core/doctor.ts`: `formatearJson` sin `ocultarCredenciales` | rojo: test 46 |
| `core/doctor.ts`: `codigoSalida` cuenta avisos | rojo: 9 tests |
| `fs/gitflow-runner.ts`: sonda acepta la marca sin exigir codigo 0 | rojo: test 33 |
| `_sonda-bash.sh`: no probar `mktemp` | **sobrevive** (MEN-5) |

Siete protecciones distintas rompen la suite; una sola sobrevive y es MENOR.
