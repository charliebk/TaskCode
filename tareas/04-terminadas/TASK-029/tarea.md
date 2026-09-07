---
id: TASK-029
titulo: "Bug de origin sin guard y deuda de los scripts de Git-Flow"
tipo: fix
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-029-bug-de-origin-sin-guard-y-deuda-de-los-s
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-07
actualizado: 2026-09-07
dependencias: []
---
## Objetivo

Item **C6** del checklist de terminacion: cerrar los cuatro frentes de deuda
que arrastran los scripts de Git-Flow, todos documentados en
`HALLAZGOS.md` (seccion "Git-Flow: deuda conocida"). El item nacio siendo
solo el bug de `origin`; C1 (TASK-026) le anadio los otros tres al envolver
los scripts con `taskctl`, y la estimacion de ~1h del checklist se quedo
obsoleta.

## Criterios de aceptacion

Transcritos del plan aprobado (`planificacion/plan-final.md`), porque
`taskctl new` deja esta seccion vacia — a diferencia de `import`, que los
extrae del fichero de entrada.

**S1 — guard de `origin`**
- [x] `create-develop.sh` sin remoto crea `develop` en local, omite el push con aviso explicito y sale 0.
- [x] `recover-branch.sh` sin remoto falla con un mensaje que se entiende (exit 1), en vez de con el error crudo de Git. No finge exito.
- [x] `resume-work.sh` sin remoto resuelve la rama en local, omite `fetch` y `ls-remote`, y avisa de que no ha sincronizado.
- [x] Test nuevo `test/gitflow/origin-guard.test.ts` con repos Git temporales reales; falla si se revierte el arreglo.

**S2 — el registro sale del workspace del usuario**
- [x] `initialize_gitflow_log` escribe en `.git/` resuelto con `git rev-parse --git-path`, no en `<repo>/logs/gitflow/`.
- [x] Tras ejecutar cualquier script en un repo temporal sin `.gitignore`, `git status --porcelain` sale vacio.
- [x] Se conserva la salvaguarda de TASK-008: sin repo Git no se escribe fichero.
- [x] El segundo guard de `taskctl pause` (el de `isIgnored`) se elimina con sus tests, **o** se conserva documentando por que si la demostracion empirica no lo respalda.
- [x] `smoke-test.sh` deja de aseverar sobre la ruta vieja.

**S3 — los mensajes dejan de remitir a menus de IntelliJ**
- [x] Los cuatro mensajes con equivalente real citan `taskctl pause | resume | recover | abort-merge`.
- [x] Los de "GitFlow 20/21" nombran el script: no se inventa un comando que no existe.

**S4 — `abort-merge` conoce cherry-pick y revert**
- [x] Con un cherry-pick o un revert a medias, el script deja de decir "estado normal" y ofrece abortarlo.
- [x] `operacionEnCurso` mira **los mismos testigos** que el script, para que `taskctl` no detecte ni mas ni menos que el.
- [x] Tests nuevos que fallan si se revierte el arreglo.

**Transversal**
- [x] Suite en verde: los 3 rojos conocidos de Windows y ninguno mas.
- [x] Revision por pares independiente, con hallazgos clasificados y documentados incluidos los no corregidos.
- [x] Checklist, contadores y estimacion del item C6 actualizados.

## Resultado

Item **C6** cerrado. Cuatro frentes de deuda de los scripts de Git-Flow,
implementados por cuatro agentes en paralelo dentro de la misma rama, con
propiedad exclusiva de ficheros para que no se pisaran.

**S1 — guard de `origin`.** `create-develop.sh`, `recover-branch.sh` y
`resume-work.sh` morian con el `fatal:` de Git en un repo sin remoto. La
respuesta correcta resulto ser **distinta por script**, y esa asimetria es el
hallazgo: `create-develop` **aborta** con origin caido (no se puede saber si
`develop` ya existe en el remoto, y crearla desde una principal obsoleta
dejaria una divergencia que el push haria permanente); `recover-branch`
**falla siempre** sin remoto, porque su proposito entero es traerse una rama
de `origin` y no hay modo local posible; `resume-work` **no aborta nunca**,
porque retomar una rama local no publica nada y abortar romperia el caso
central de volver a tu rama con la VPN caida.

**S2 — el registro sale del workspace.** Pasa de `<repo>/logs/gitflow/` a
`.git/taskcode/gitflow/`, resuelto con `git rev-parse --git-path` para que
siga valiendo en un worktree enlazado. `.git/` no esta en el arbol de
trabajo, asi que `git status` no lo ve nunca: la clase entera de problema
desaparece en vez de taparse. Consecuencia en cadena: el segundo guard de
`taskctl pause` se quedo sin motivo y se retiro, y con el **`isIgnored`
entera**, que se quedo sin ningun consumidor.

**S3 — mensajes.** Los cuatro con equivalente real citan `taskctl`; los de
"GitFlow 20/21" nombran el script, porque no existe wrapper para mirror ni
para switch y documentar un comando inexistente ya nos ha costado tiempo.

**S4 — `abort-merge` ve cherry-pick y revert.** Al medir aparecio un tercer
testigo que el plan no preveia: si resuelves el conflicto con `git commit` en
vez de `--continue`, Git borra `CHERRY_PICK_HEAD`, la secuencia sigue viva y
lo unico que queda es `.git/sequencer/`. En sentido contrario, `cherry-pick
-n` no deja rastro y el propio Git se niega a abortar, asi que ahi decir
"estado normal" es correcto.

### Correcciones al plan aprobado

Dos afirmaciones del plan resultaron **falsas** al tocarlas:

1. Decia que `create-hotfix.sh` y `create-release.sh` usan
   `detect_origin_available`. No la usan: llevan una copia inline de
   TASK-009, anterior a la extraccion de B2, que detecta si hay remoto pero
   **no distingue "sin origin" de "origin caido"**. Queda como deuda viva.
2. Decia que `CHERRY_PICK_HEAD` y `REVERT_HEAD` bastaban como testigos. No
   bastan (ver S4).

### Revision por pares

**Ronda 1: cambios-solicitados** — 0 criticos, 2 importantes, 5 menores.

- **IMPORTANTE**: `diagnose-repo.sh` tenia el mismo punto ciego que
  `abort-merge` y decia *"Sin operaciones en curso"* con un cherry-pick a
  medias, tres lineas encima de su propio `UU a.txt`, contradiciendo a
  `taskctl abort-merge` sobre el mismo repo.
- **IMPORTANTE**: en el caso del sequencer huerfano, `abort-merge` afirmaba
  haber *"restaurado el estado previo"* sin haber rebobinado nada.

**Mi primer arreglo del segundo era falso.** Elegi como discriminante
comparar HEAD antes y despues del `--abort` — suena empirico — y resulta que
en un cherry-pick de UN SOLO commit en conflicto HEAD tampoco se mueve, asi
que daba el mensaje del caso raro en el caso normal: exactamente la mentira
que la correccion venia a quitar. El discriminante correcto es la ausencia
del testigo. Lo destapo probar **el caso que daba por bueno**, no el que
estaba arreglando. Registrado en `HALLAZGOS.md` como patron.

**Ronda 2: APROBADA** — 0 criticos, 0 importantes, 2 menores, ambos
corregidos. El revisor construyo ademas el revert huerfano de sequencer (que
no existia en la ronda 1) y busco el caso inverso donde el mensaje siguiera
mintiendo: no existe por ese camino.

Uno de los dos menores es una **imprecision mia en el mensaje de commit**:
afirme que los 4 tests nuevos fallan contra el codigo anterior, y uno pasa —
el que fija que el caso normal sigue diciendo "restaurado" ya era cierto
antes. Solo falla contra el arreglo falso intermedio, que es donde gana su
sitio, pero la frase prometia mas de lo medido.

### No corregido, documentado

- `create-hotfix.sh` / `create-release.sh` con su guard inline pre-B2.
- `detect_origin_available` imprime *"Se continuara en modo local"* tambien
  cuando quien la llama aborta acto seguido.
- El flag `--push|-p` de `create-develop.sh` se parsea y nunca se lee.
- `invoke_git` se traga el *"You seem to have moved HEAD. Not rewinding"* de
  Git; el script lo compensa con su propio mensaje, pero el aviso original no
  llega.
- `DETALLE : Rebase abortado en rama ` sale con la rama vacia: durante un
  rebase `git branch --show-current` no devuelve nada. Preexistente.
- El historico `logs/gitflow/` de este repo queda huerfano. No se borra:
  mezclar limpieza de historico con un cambio de comportamiento hace la
  revision mas dificil.

### Metricas

472 tests (31 nuevos, menos 3 que se fueron con `isIgnored`); 469 verdes y
los 3 rojos conocidos de este entorno Windows. Estimacion del checklist para
C6: ~1h, que era de cuando C6 era solo el bug de `origin`. Real: ~5h.
