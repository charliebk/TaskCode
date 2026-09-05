# Hallazgos acumulados

Trampas que ya costaron tiempo y patrones que merece la pena repetir. Ordenado
por lo que más probablemente te muerda hoy.

## Patrones a reutilizar

### Doble lectura cuando un comando cambia de rama a mitad (TASK-012)

Los dos únicos CRÍTICOS de Sprint 1 salieron de aquí, y uno era **pérdida de
datos real**: `approve` leía la tarea una vez, antes de que
`ensureBaseBranchReady` pudiera cambiar de rama, y luego escribía con esa
lectura ya obsoleta — sobrescribiendo en silencio el contenido real de la rama
base.

La regla: **la lectura que decide qué se escribe SIEMPRE va después del posible
cambio de rama.** Una lectura anterior solo sirve para rechazo rápido sin tocar
Git, o para extraer metadata estable (el `tipo` de la tarea, que hace falta
para resolver la rama). Aplica a cualquier comando futuro que toque Git a mitad
de su lógica.

### Preguntas abiertas como steps de CI que aseveran

Cuando hay una hipótesis que no se puede comprobar desde el entorno de
trabajo, se convierte en **un step de CI propio que la asevera**, con
`continue-on-error: true`. El verde/rojo del step *es* la respuesta, y se lee
por la API de jobs sin necesidad de bajar logs. Así se cerraron de golpe cinco
preguntas que llevaban abiertas desde TASK-006/007.

## Windows: resuelto por CI el 2026-09-05

Cinco preguntas que arrastraban TASK-006/007/008/009/010/011, todas
contestadas **que sí** sobre un checkout nativo de Windows:

| Pregunta | Respuesta |
|---|---|
| ¿`bin/taskctl` conserva el bit `+x` tras un checkout nativo? | Sí |
| ¿`taskctl` resuelve como comando suelto vía PATH? | Sí |
| ¿Los `.sh` de Git-Flow corren bajo Git Bash nativo? | Sí (smoke test completo) |
| ¿`node bin/taskctl` funciona desde `cmd.exe`, sin Git Bash? | Sí |
| ¿Pasa la suite completa en Windows? | Sí, tras corregir el glob |

`claude plugin validate` también pasó en CI, para el manifiesto del plugin y
para el del marketplace.

**Lo único que salió mal, ya corregido**: el script `test` de `package.json`
expandía los globs en el shell, y `cmd.exe` no expande globs, así que la suite
entera fallaba en Windows. Con el glob **entrecomillado** lo expande Node.
Ojo también: `node --test <directorio>` NO escanea recursivamente en Node 22 —
trata el argumento como un fichero y falla con `MODULE_NOT_FOUND`.

## `taskctl import`: tres limitaciones reales

Descubiertas usándolo de verdad para crear TASK-013…TASK-023:

1. **Aplica los mismos flags a todas las entradas del fichero.** Si las tareas
   tienen distinto sprint o complejidad, hacen falta varias pasadas.
2. **No sabe expresar `dependencias` en absoluto.** Hay que editar el
   frontmatter a mano después.
3. **No se puede ejecutar dos veces seguidas.** Las carpetas que crea dejan el
   workspace sucio, y el guard de §8.3 aborta la siguiente invocación — la
   herramienta genera justo la suciedad que bloquea su próximo uso. Hay que
   commitear en medio.

La (3) es evidencia directa a favor de implementar el paso 5 de §8.3
(auto-commit), que es el item **C2** del checklist.

Corolario operativo: **los ficheros que le pases a `import` van fuera del
repo.** Dentro, ensucian el workspace y abortan el propio import.

## Git-Flow: deuda conocida

- **Bug de `origin` sin guard** en 3 scripts que siguen sin corregir:
  `create-develop.sh`, `recover-branch.sh`, `resume-work.sh` (item C6). Los
  dos `merge-*-to-main` se corrigieron en B2 (2026-09-05) con un matiz que
  añadió la revisión por pares: distinguen "sin origin configurado" (modo
  local, como los merge a develop) de "origin configurado que no responde"
  (abortan con instrucción, porque el tag de release se crearía sobre una
  `main` posiblemente obsoleta respecto al remoto).
- **Confirmado por la revisión de B2 (preexistente, sin corregir)**: ejecutar
  dos veces un `merge-*-to-main` con el mismo nombre muere en el tag
  duplicado (`exit 1`, sin mensaje de guía), y un conflicto en el backmerge
  dejaría `MERGE_HEAD` pendiente tras haber completado merge y tag en
  `main`. Ambos pertenecen al alcance de TASK-014 (item B3).
- **`core.fileMode` está en `false`** en este repo. Por eso los scripts se
  invocan **siempre** como `bash script.sh`, nunca por ruta directa: así el bit
  de ejecución deja de importar.
- **Riesgo de colisión de IDs entre ramas**: un `hotfix` resuelve la rama base
  a `main`, que puede no compartir el historial de `tareas/` con `develop`
  mientras no haya backmerge. Documentado vía test en TASK-012, sin corregir.
  Lo destapa TASK-014.
- **`create-hotfix.sh` borra `tarea.md` del working tree** al hacer checkout
  desde `main` si esa rama no tiene el historial de `tareas/`. No se pierde
  nada: `taskctl` ya leyó la tarea en memoria y `moveTareaFile` la recrea
  (opción `tolerateMissingSource`, acotada a este caso).

## Divergencias entre la metodología y lo implementado

- **`taskctl board`**: la tabla de la sección 8 dice que "regenera
  `docs/BOARD.md`". Lo implementado es un listado por pantalla. Pendiente de
  resolver en un sentido u otro (item B5).
- **Paso 5 de §8.3** (que `taskctl` commitee y suba lo que genera): sin
  implementar y sin decidir. Mientras no exista, una tarea nueva no llega al
  resto del equipo sola.
- **El plugin no tiene `skills/` ni `agents/`.** Hoy es un CLI y unos scripts:
  todo el discurso de agentes especializados de la metodología no tiene aún
  ningún artefacto.

## Cosas del entorno anterior que ya NO aplican

Hasta el 2026-09-05 se trabajó desde un bridge de dispositivo de Cowork (una VM
Linux montando la carpeta de Windows). Estas limitaciones eran **del bridge**,
no de Windows, y en IntelliJ nativo no deberían aparecer:

- El punto de montaje sintetizaba `-rwx------` para **cualquier** fichero, así
  que `ls -la` nunca fue evidencia válida de permisos. En nativo sí lo es.
- El bridge no podía borrar ficheros dentro de `.git`, así que un commit
  interrumpido dejaba un `.git/index.lock` huérfano que bloqueaba Git entero.
  En nativo, `rm .git/index.lock` y listo.
- No había un CLI interactivo de Claude Code disponible, así que
  `claude --plugin-dir` y `/plugin install` nunca se pudieron probar de verdad.
  **En IntelliJ sí se puede** — y es lo único que le queda pendiente a
  TASK-021.

## El entorno nativo (Windows/IntelliJ): trampas confirmadas el 2026-09-05

- **`bash` invocado desde PowerShell resuelve al de WSL** (el de System32),
  que revienta con "execvpe failed" si no hay distro instalada. Todo lo que
  spawnea `bash` (la suite entera, los scripts de Git-Flow) necesita la
  carpeta usr-bin de Git for Windows (`C:\Program Files\Git\usr\bin`) PREPENDIDA al
  PATH. Y peor: invocar el bash de Git por ruta absoluta sin ese PATH deja a
  bash sin coreutils (`mktemp`, `dirname`, `grep`...) — así llegó el smoke
  test a ejecutar `git init` dentro del working tree real del plugin (ya
  tiene guard que aborta, añadido en B2).
- **3 tests fallan en local y pasan en CI**, y no son regresiones (fallan
  idéntico en `develop`): los dos del truco del symlink (`EPERM`: sin
  privilegio de symlink en Windows no se pueden crear) y uno de `plan` que
  compara contenido esperando finales LF mientras `core.autocrlf=true`
  materializa CRLF en el checkout. Referencia local: "suite verde" = fallan
  solo esos 3.

## Detalles de testing que costaron encontrarlos

- `chmod` sobre el directorio de una tarea no sirve para forzar un `stat`
  no-ENOENT si ese directorio también contiene `tarea.md`: el `EACCES`
  enmascara el caso real. Se usa un **symlink autorreferencial** (`ELOOP`) en
  su lugar.
- Los clones de smoke test no heredan `dist/` ni `node_modules/` (están en
  `.gitignore`): hay que `npm install && npm run build` siempre, y **otra vez**
  tras cada `checkout` de rama dentro del mismo clon.
- Un clon nuevo en `/tmp` no tiene identidad de Git configurada. Sin
  `git config user.email/user.name` local, cualquier commit falla con
  `exit 128` — y si va encadenado con `&&`, el fallo aparece más tarde y
  despista.
