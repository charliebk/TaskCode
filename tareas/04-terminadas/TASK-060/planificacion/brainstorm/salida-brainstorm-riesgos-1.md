# Brainstorm — TASK-060, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos (sonnet)

## Riesgos, de mayor a menor dano

### 1. Tag publicado sobre el commit equivocado o con main sin subir (EL QUE MAS PREOCUPA)

- **Cuando:** `--tag` con `--push` en el camino idempotente, en el segundo
  `finish` del MR o en hotfix/release.
- **Que pasa:** el tag cuelga de un commit que no es el merge (HEAD tras el
  chore de cierre, o un squash sin commit de merge), o apunta a un commit que
  no esta en main remota.
- **Por que es grave:** un tag remoto es de facto irreversible, y lo ven CI,
  releases y el equipo.
- **Mitigacion:**
  - calcular el commit objetivo de forma explicita (merge verificado, no
    `HEAD`);
  - `ls-remote --tags` para comprobar que el nombre no existe en origin;
  - subir el tag solo tras confirmar que la rama destino esta en el remoto.
- **Verificado:** `finish.ts` NO reenvia `--push` al script (solo pasa
  `[rama, --develop, base]`), y `autoCommit` solo sube la rama actual. Hoy ni
  main ni el tag de hotfix/release se suben desde `finish`: subir solo el tag
  seria un comportamiento nuevo y asimetrico.

### 2. Reintento tras un fallo parcial, bloqueado por la propia validacion previa

- **Cuando:** el merge se consuma, falla despues el tag, el cierre o el push,
  y la persona reejecuta.
- **Que pasa:** la regla «si el tag existe, aborta antes de mergear» choca con
  el camino idempotente (finish.ts L359-367). El tag que acabas de crear te
  impide cerrar, o el reintento lo recrea en `HEAD`.
- **Mitigacion:** distinguir «tag ya puesto por esta tarea sobre su merge»
  (vale, se salta) de «tag ajeno» (aborta).

### 3. El segundo `finish` no detecta la integracion del MR

- **Cuando:** el MR se mergea por squash o rebase, algo muy comun.
- **Que pasa:** `isAncestor(rama, base)` es falso para siempre. La tarea queda
  atascada en `en-revision` y el tag «sobre el merge real» no tiene donde
  ponerse.
- **Mitigacion:** consultar el estado del PR a la plataforma, y decidir en el
  plan que pasa con squash.

### 4. Red caida, `fetch` fallido o base local divergente en el segundo `finish`

- **Cuando:** origin no responde, o `develop` local tiene commits sin subir.
- **Que pasa:** el fallo se confunde con «abierto», o peor, con «integrado»
  leyendo una ref local obsoleta.
- **Mitigacion:** tres resultados (integrado / abierto / no se pudo saber), y
  en el tercero abortar sin tocar nada.

### 5. MR duplicado o URL perdida a mitad

- **Cuando:** el proceso muere, o `gh`/`glab` falla entre subir la rama, crear
  el MR y anotar la URL.
- **Que pasa:**
  - reejecutar crea un segundo MR, o `gh` falla porque ya existe;
  - la URL anotada tras el push queda fuera de lo mergeado, y el segundo
    `finish` no la encuentra.
- **Mitigacion:** buscar un MR abierto de esa rama antes de crear, y derivar
  el MR de la rama, no de `tarea.md`.

### 6. Deteccion de la plataforma por la URL de origin

- **Cuando:** URLs scp (`git@host:grupo/sub/repo.git`), GitLab autoalojado sin
  «gitlab» en el host, GitHub Enterprise, una `pushurl` distinta, o
  credenciales incrustadas (`https://user:token@host/...`).
- **Que pasa:** se elige mal la plataforma, o el token acaba impreso en un
  error o escrito en `tarea.md`, que se commitea.
- **Mitigacion:** no volcar nunca la URL cruda, y ante un host desconocido
  abortar nombrando que configurar.

### 7. Invocar `gh`, `glab` y `git tag` con entrada del usuario

- **Cuando:** `--tag -x`, o un titulo que empieza por `-` o lleva comillas.
  En Windows, ademas, un doble `.cmd` no lo lanza un `spawn` sin shell.
- **Que pasa:** inyeccion de opciones, o un fallo que solo se da en Windows.
- **Mitigacion:**
  - `execFile` con array de argumentos y `--` donde aplique;
  - `check-ref-format` sobre `refs/tags/<n>`, no sobre el nombre suelto.

## Puntos sin retorno

- **Push del tag a origin (y de la rama del MR).** Otros pueden haberlo
  descargado; mover o borrar un tag publicado rompe a quien ya lo tiene.
- **Merge del MR en la plataforma.** Ocurre fuera de `taskctl`; si despues
  `finish` falla, solo se corrige a mano en local.
- **Merge local `--no-ff` ya consumado.** Se deshace con `git reset` solo si
  nada se ha subido.

## Descartado a proposito

- **CRLF, `chmod` y symlink en Windows:** son los 3 rojos conocidos.
- **Dos `finish` simultaneos:** el workspace limpio ya los serializa.
- **Texto localizado de `gh`/`glab`:** se usan el codigo de salida y la URL,
  no se parsea prosa.

## Desacuerdos previstos

Los tres son con arquitectura:

- **Donde vive «MR abierto».** La maquina de estados exige `en-revision` para
  `finish` (state-machine.ts L297). Un texto libre en `tarea.md` es fragil:
  hace falta un campo parseable o derivarlo del remoto.
- **Tag sustituto en hotfix/release.** Prefiere abortar con un mensaje claro
  antes que tocar los `.sh`, que tambien usan los wrappers directos.
- **Clave nueva de config.** `CLAVES_CONFIG` aborta ante claves desconocidas
  (config.ts L300). Un plugin antiguo sobre un repo con la clave nueva falla
  en TODOS los comandos.

## Suposiciones no verificadas

- **Flujo real:** `finish` corre desde la rama de la tarea y el cierre termina
  en develop. Hay que probarlo con un MR.
- **`--push`:** sigue sin reenviarse a los scripts de Git-Flow.
- **Dobles en Windows:** que los `gh`/`glab` de prueba en PATH funcionen en
  Windows nativo.
- **Frontmatter:** no se ha mirado `core/task.ts`.
- **Lecturas pendientes:** no se han leido `skills/finish/SKILL.md` ni los
  tests actuales de finish.
