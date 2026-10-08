---
id: TASK-062
titulo: "taskctl doctor: comprobar que un proyecto esta listo antes de trabajar"
tipo: feature
sprint: 8
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-062-taskctl-doctor-comprobar-que-un-proyecto
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 456645
tokens_implementacion: 11106140
tokens_revision: null
creado: 2026-10-08
actualizado: 2026-10-08
dependencias: []
---
## Objetivo

Con el plugin publico, cualquiera lo instala en su proyecto y necesita saber, antes de empezar, si todo lo que el flujo necesita esta en su sitio (Carlos, 2026-10-08). `taskctl doctor` lo comprueba en un solo paso: entorno (Node, Git, bash utilizable para los scripts de Git-Flow), repositorio (estructura `tareas/`, ramas base, origin, workspace), configuracion (`.taskcode/config.yml` valida) y lo necesario para las opciones elegidas (`gh`/`glab` y su sesion si hay merge request por defecto o plataforma declarada). Solo lee y nunca toca nada: para cada fallo dice el comando exacto que lo arregla. Se llama `doctor` porque `status` se confunde con el estado de una tarea y `diagnose` ya existe (diagnostico de Git-Flow).

## Criterios de aceptacion
- [ ] `taskctl doctor` imprime una linea por comprobacion con su resultado (ok, aviso o error) y, para cada aviso o error, el comando o paso concreto que lo arregla.
- [ ] Sale con codigo 0 si no hay errores (los avisos no cuentan) y con codigo 1 si hay alguno; `taskctl doctor --json` da lo mismo en JSON para que una skill lo lea.
- [ ] Comprueba el entorno: version de Node soportada, `git` disponible y un `bash` que pueda ejecutar los scripts de Git-Flow (en Windows, el de Git y no el de WSL).
- [ ] Comprueba el repositorio: que es un repo Git, las cinco carpetas `tareas/00-planificadas` a `tareas/04-terminadas`, la rama `develop` y la principal (`main` o `master`), si hay `origin` y si el workspace esta limpio.
- [ ] Comprueba `.taskcode/config.yml` con el mismo validador que el resto de comandos y lista las claves desconocidas como aviso.
- [ ] Comprueba la coherencia de las tareas: cada `tarea.md` valida y con `estado` igual a la carpeta donde esta; las incoherencias salen como error con el ID.
- [ ] Si la config pide merge request por defecto o declara plataforma, comprueba que `gh` o `glab` estan instalados y con sesion (sin subir nada); si no, esa comprobacion sale como omitida.
- [ ] No escribe, no hace commits, no cambia de rama ni llama a la red salvo la comprobacion de sesion de la plataforma, y no imprime URLs con credenciales.
- [ ] La skill `task-workflow` dice que se ejecute `taskctl doctor` al empezar en un proyecto, y se elimina `status` de la lista de comandos que no existen solo si hace falta para no confundir; README y CHANGELOG lo documentan.
- [ ] Tests contra repos Git temporales reales: proyecto completo (todo ok), sin `tareas/`, sin `develop`, config invalida, tarea en carpeta equivocada, workspace sucio, y la salida `--json`; con el doble de `gh`/`glab` para la comprobacion de sesion.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-08T11:09:31Z | plan | manual | persona |
| 2026-10-08T11:19:52Z | approve | manual | persona |
| 2026-10-08T14:56:15Z | start | manual | persona |
