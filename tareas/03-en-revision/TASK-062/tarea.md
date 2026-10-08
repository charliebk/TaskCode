---
id: TASK-062
titulo: "taskctl doctor: comprobar que un proyecto esta listo antes de trabajar"
tipo: feature
sprint: 8
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-062-taskctl-doctor-comprobar-que-un-proyecto
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 456645
tokens_implementacion: 19428626
tokens_revision: 6153459
creado: 2026-10-08
actualizado: 2026-10-08
dependencias: []
---
## Objetivo

Con el plugin publico, cualquiera lo instala en su proyecto y necesita saber, antes de empezar, si todo lo que el flujo necesita esta en su sitio (Carlos, 2026-10-08). `taskctl doctor` lo comprueba en un solo paso: entorno (Node, Git, bash utilizable para los scripts de Git-Flow), repositorio (estructura `tareas/`, ramas base, origin, workspace), configuracion (`.taskcode/config.yml` valida) y lo necesario para las opciones elegidas (`gh`/`glab` y su sesion si hay merge request por defecto o plataforma declarada). Solo lee y nunca toca nada: para cada fallo dice el comando exacto que lo arregla. Se llama `doctor` porque `status` se confunde con el estado de una tarea y `diagnose` ya existe (diagnostico de Git-Flow).

## Criterios de aceptacion
- [x] `taskctl doctor` imprime una linea por comprobacion con su resultado (ok, aviso o error) y, para cada aviso o error, el comando o paso concreto que lo arregla.
- [x] Sale con codigo 0 si no hay errores (los avisos no cuentan) y con codigo 1 si hay alguno; `taskctl doctor --json` da lo mismo en JSON para que una skill lo lea.
- [x] Comprueba el entorno: version de Node soportada, `git` disponible y un `bash` que pueda ejecutar los scripts de Git-Flow (en Windows, el de Git y no el de WSL).
- [x] Comprueba el repositorio: que es un repo Git, las cinco carpetas `tareas/00-planificadas` a `tareas/04-terminadas`, la rama `develop` y la principal (`main` o `master`), si hay `origin` y si el workspace esta limpio.
- [x] Comprueba `.taskcode/config.yml` con el mismo validador que el resto de comandos y lista las claves desconocidas como aviso.
- [x] Comprueba la coherencia de las tareas: cada `tarea.md` valida y con `estado` igual a la carpeta donde esta; las incoherencias salen como error con el ID.
- [x] Si la config pide merge request por defecto o declara plataforma, comprueba que `gh` o `glab` estan instalados y con sesion (sin subir nada); si no, esa comprobacion sale como omitida.
- [x] No escribe, no hace commits, no cambia de rama ni llama a la red salvo la comprobacion de sesion de la plataforma, y no imprime URLs con credenciales.
- [x] La skill `task-workflow` dice que se ejecute `taskctl doctor` al empezar en un proyecto, y se elimina `status` de la lista de comandos que no existen solo si hace falta para no confundir; README y CHANGELOG lo documentan.
- [x] Tests contra repos Git temporales reales: proyecto completo (todo ok), sin `tareas/`, sin `develop`, config invalida, tarea en carpeta equivocada, workspace sucio, y la salida `--json`; con el doble de `gh`/`glab` para la comprobacion de sesion.

## Resultado

Cerrada el 2026-10-08 en 1 ronda de revision por pares
(aprobada-con-correcciones). Los MENOR se corrigieron sin ronda 2.

**Lo entregado.** `taskctl doctor [--json]` solo lee: no escribe, no
commitea, no cambia de rama y toma el indice con `GIT_OPTIONAL_LOCKS=0`. Cada
comprobacion da ok, aviso, error u omitida, con su arreglo concreto. Una
excepcion es un `error` de esa comprobacion, y con `--json` stdout lleva
solo el JSON. Sale con codigo 1 solo si hay errores.

- **Entorno.**
  - Node 22 o superior, declarado en `engines`.
  - git.
  - bash: se ejecuta un script real (`_sonda-bash.sh`, con `mktemp`,
    `dirname`, `grep` y `git`) del mismo modo que los scripts de
    Git-Flow. En Windows detecta el bash de WSL y un bash de Git sin sus
    utilidades.
- **Repo.**
  - Repo Git, tambien un worktree, y si tiene commits.
  - Las carpetas `tareas/`.
  - La rama base (`rama_base`) y la principal.
  - `origin`: aviso; error solo con `cierre_por_defecto: merge-request`.
  - El workspace (un lock o un timeout son aviso).
- **Config.** `resolverConfigConAvisos`: un valor invalido es error y una
  clave desconocida, aviso. Con la config invalida, lo que depende de ella
  sale como omitido.
- **Tareas.** Recorrido propio, con error ante:
  - un ID duplicado en dos carpetas;
  - un `tarea.md` ilegible, con la causa;
  - una carpeta sin `tarea.md`;
  - un estado distinto de la carpeta.
- **Plataforma.** Solo si hay merge request por defecto o plataforma
  declarada. La sesion se comprueba con `sondearCli`, con un timeout de 10
  s, y si no se puede verificar por red es aviso.
- **Refactors sin cambio de comportamiento.** `sondearCli`,
  `resolverRemotoDeOrigin` y `resolverConfigConAvisos`. La suite de finish
  no cambia ninguna expectativa.
- **Skill `task-workflow`.** Manda ejecutar `doctor` al empezar. `status`
  sigue entre los comandos que no existen, con una nota que apunta a `doctor`
  y a `board`.

**Revision por pares (ronda 1).** Verificado con el CLI real en 14
escenarios. No modifica nada (mtime de `.git/index` y HEAD intactos), el
JSON es valido con errores, y no hay ningun OK falso con el bash de WSL o con
un bash de Git sin utilidades. Hubo 5 MENOR, todos corregidos:

- **MEN-1:** parrafo duplicado en la skill, ahora con un test.
- **MEN-2:** con la config invalida se usaban los valores por defecto.
- **MEN-3:** prefijo `[ERROR]` duplicado.
- **MEN-4:** Node minimo sin respaldo: pasa a 22, con `engines`.
- **MEN-5:** la sonda sin `mktemp` no tenia test (el mutante sobrevivia), y
  un timeout de `git status` daba error.

Mutantes: 11 del implementador, 8 del revisor (uno sobrevivio y se corrigio
con MEN-5) y 5 de las correcciones, todos muertos. Suite completa: 1346 de
1351, con los 3 rojos conocidos de Windows y 2 de timing de
`origin-deteccion` que pasan solos.

**Coste:** diseno 0,5 M, implementacion 19,4 M y revision 6,2 M.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-08T11:09:31Z | plan | manual | persona |
| 2026-10-08T11:19:52Z | approve | manual | persona |
| 2026-10-08T14:56:15Z | start | manual | persona |
| 2026-10-08T16:06:01Z | review | manual | persona |
