---
id: TASK-060
titulo: "Opciones de cierre en finish: merge normal, merge request y tag"
tipo: feature
sprint: 8
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-060-opciones-de-cierre-en-finish-merge-norma
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 491233
tokens_implementacion: 32420615
tokens_revision: 14576760
creado: 2026-10-06
actualizado: 2026-10-06
dependencias: []
---
## Objetivo

`taskctl finish` hoy solo sabe hacer un merge local `--no-ff` con el script de Git-Flow del tipo, y solo hotfix y release llevan tag (obligatorio). Se quiere poder elegir, al cerrar, entre merge normal (por defecto), abrir un merge request en la plataforma del remoto, y poner un tag anotado sobre el merge. Todo opcional: sin flags, el comportamiento es el de hoy. Decisiones de Carlos (2026-10-06): GitHub y GitLab detectados por la URL de origin (`gh pr create` / `glab mr create`, tambien GitLab autoalojado); con merge request la tarea espera en revision y un segundo `finish` la cierra cuando el MR esta mergeado en el remoto; el tag es `--tag <nombre>`, anotado, sobre el commit de merge, y solo se sube con `--push`; pregunta la skill finish en modo manual y semiautomatico, y en automatico se usa el merge normal sin tag salvo que `.taskcode/config.yml` diga otra cosa.

## Criterios de aceptacion
- [x] `taskctl finish TASK-NNN` sin flags nuevos se comporta exactamente como hoy (la suite existente de finish sigue en verde sin cambiar expectativas).
- [x] `taskctl finish TASK-NNN --tag <nombre>` crea un tag anotado sobre el commit de merge con el titulo de la tarea como mensaje; si el tag ya existe o el nombre no es valido (`git check-ref-format`), aborta antes de mergear sin tocar nada.
- [x] El tag solo se sube con `--push`; sin `--push` queda local y la salida lo dice.
- [x] En hotfix y release, `--tag` sustituye el nombre del tag que pone el script en lugar de crear un segundo tag, o aborta con un mensaje claro si no es posible (decidir en el plan).
- [x] `taskctl finish TASK-NNN --merge-request` sube la rama, abre el PR (GitHub, `gh`) o MR (GitLab, `glab`) contra la rama base segun la URL de origin, anota la URL en `tarea.md` y deja la tarea en `en-revision`.
- [x] Sin el CLI de la plataforma, sin autenticar, con origin no reconocido o sin origin, `--merge-request` aborta antes de subir nada con un mensaje que dice que instalar o configurar.
- [x] Un segundo `taskctl finish TASK-NNN` sobre una tarea con MR abierto comprueba en el remoto si la rama esta integrada en la base: si lo esta, mueve la tarea a `terminada` y regenera CHANGELOG, INDEX y BOARD; si no, aborta diciendo que el MR sigue abierto, sin tocar nada.
- [x] `--tag` combinado con `--merge-request` pone el tag en el segundo `finish`, sobre el merge real traido del remoto.
- [x] `.taskcode/config.yml` acepta una clave para el cierre por defecto (merge normal o merge request) que usa el modo automatico; una clave o valor mal escrito aborta como el resto de claves.
- [x] La skill `finish` pregunta en modo manual y semiautomatico (merge normal por defecto, merge request, tag opcional) y en automatico no pregunta; la skill no menciona el proyecto ni rutas internas.
- [x] Tests contra repos Git temporales reales para merge normal con tag, tag duplicado, push del tag a un remoto bare, y el ciclo MR con un CLI de plataforma simulado por un ejecutable de prueba en el PATH (el unico doble admitido: no hay GitHub ni GitLab en el CI).

## Resultado

Cerrada el 2026-10-06 en 2 rondas de revision por pares.

**Lo entregado.**

- **Tag.** `taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--push]`.
  - El tag es anotado, con el titulo como mensaje, y va sobre el commit de
    merge calculado explicitamente (nunca `HEAD` tras el chore de cierre).
  - Se valida antes de mergear: `check-ref-format`, que no exista en local y,
    con `ls-remote`, que no exista en origin.
  - En un reintento, un tag propio se salta y uno ajeno aborta.
  - Solo se sube con `--push`, y solo cuando la rama destino ya esta en
    origin.
  - En hotfix y release, `--tag` lo recibe el script, que lo usa en lugar
    del nombre calculado. Sigue habiendo un solo tag.
- **`--merge-request` (GitHub con `gh`, GitLab con `glab`, segun el host de
  origin).**
  - Primero un preflight sin efectos: origin, plataforma, CLI y sesion.
    Despues sube la rama (decision de Carlos), reutiliza el PR abierto si
    existe y anota `## Merge request` en `tarea.md`. La tarea sigue en
    revision.
  - El segundo `finish` consulta a la plataforma.
    - `merged` (merge, squash o rebase): fetch, ff de la base, cierre y tag
      sobre el commit que da la plataforma.
    - Abierto, cerrado o no se puede saber: aborta sin tocar nada.
  - La URL de origin no se imprime ni se escribe nunca: puede llevar
    credenciales, y todo stderr pasa por `ocultarCredenciales`.
- **Config.** Clave `cierre_por_defecto` (`merge` | `merge-request`), que la
  skill lee via `taskctl siguiente --json` (campo `cierre`). El CHANGELOG
  avisa de la compatibilidad.
- **Skill `finish`.** Pregunta en los modos manual y semiautomatico. En
  automatico usa `cierre_por_defecto` y nunca inventa un `--tag`.

**Desvios declarados y aceptados por la revision.**

- Un `finish` sin flags sobre una tarea con `## Merge request` sigue por el
  camino del MR, para no mergear en local lo que tiene un MR abierto.
- La URL va en una seccion propia `## Merge request`.
- `--merge-request` en hotfix y release aborta.
- `cierre_por_defecto` solo la lee la skill.
- El doble de `gh`/`glab` en Windows son enlaces duros a `node.exe` con
  `--require` en `NODE_OPTIONS`, porque `spawnSync` sin shell no lanza un
  `.cmd`.
- Con origin caido: con `--push` aborta antes de mergear; sin `--push` avisa
  y sigue.

**Revision por pares.**

- *Ronda 1* (cambios-solicitados).
  - **IMP-1, reproducido:** el segundo `finish` daba por integrada una rama
    con commits locales que no llegaron al MR. Ahora compara contra la punta
    que integro la plataforma (`headRefOid` en gh, `sha` en glab), solo
    tolera el commit de anotacion del primer `finish`, y aborta tambien si
    `origin/<rama>` avanzo despues del merge. Mutantes N1 y N2.
  - **MEN-1:** `avance.md` y el push de `--merge-request`.
  - **MEN-2:** `--tag` sin valor en los scripts.
  - **MEN-3 y MEN-4:** desvios aceptados.
  - Todos corregidos.
- *Ronda 2* (aprobada-con-correcciones). Todo cerrado y verificado en 44
  escenarios propios del revisor. Los dos MENOR nuevos se corrigieron sin
  ronda 3:
  - **MENOR-5:** test de la rama de origen borrada tras mergear, que mata el
    mutante `referencia = origin/<rama>`.
  - **MENOR-6:** la skill registra el coste antes del cierre y no commitea
    nada en la rama entre el primer y el segundo `finish`. Habia un caso
    real: el commit de `registrar-coste` bloqueaba el segundo cierre.
- *Mutantes:* M1 a M12 (primera pasada), N1 a N5 (ronda 1) y P1 (MENOR-5),
  todos muertos. Los dos revisores probaron 13 mas por su cuenta.

**Coste** (registrado con `registrar-coste`): diseno 0,5 M, implementacion
32,4 M y revision 14,6 M.

**Pendiente, fuera de esta tarea.**

- *Agente reanudado:* su transcripcion acumula todas las pasadas, asi que
  `registrar-coste --agente` cuenta dos veces lo ya registrado. Aqui se
  registro la diferencia con `--tokens`.
- *`taskctl import`:* convierte un criterio escrito como `- [ ] texto` en
  `- [ ] [ ] texto` (pasó con esta misma tarea).

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-06T17:09:04Z | plan | manual | persona |
| 2026-10-06T17:24:12Z | approve | manual | persona |
| 2026-10-06T17:24:13Z | start | manual | persona |
| 2026-10-06T19:13:26Z | review | manual | persona |
| 2026-10-06T20:30:24Z | review | manual | persona |
