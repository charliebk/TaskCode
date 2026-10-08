---
id: TASK-061
titulo: "Merge request en cualquier GitLab, tambien autoalojado"
tipo: feature
sprint: 8
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-061-merge-request-en-gitlab-autoalojado-tamb
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 394880
tokens_implementacion: 18900341
tokens_revision: null
creado: 2026-10-08
actualizado: 2026-10-08
dependencias: []
---
## Objetivo

El plugin tiene que funcionar en cualquier proyecto con el repo en GitHub o en GitLab (decision de Carlos, 2026-10-08: el repo es publico y lo usara mas gente). Los scripts de Git-Flow y `taskctl` ya son independientes de la plataforma (solo hablan con `origin` por Git). Lo unico atado a la plataforma es `taskctl finish --merge-request` (0.6.0), que reconoce github.com y los hosts que contienen "gitlab" (como gitlab.com), y aborta con "host desconocido" ante cualquier GitLab autoalojado con otro dominio (`git.empresa.com`) o instalado bajo una ruta (`https://servidor/ruta/gitlab`). Hay que poder declarar la plataforma y la URL base de la instancia en `.taskcode/config.yml` para que el merge request funcione contra cualquier GitLab, y que todo siga igual cuando no se declara nada.

## Criterios de aceptacion
- [ ] Sin configuracion nueva, `finish --merge-request` se comporta exactamente como en la 0.6.0 (deteccion por host; la suite existente de finish-merge-request sigue en verde sin cambiar expectativas).
- [ ] `.taskcode/config.yml` permite declarar la plataforma (`github` o `gitlab`) y la URL base de la instancia; un valor invalido aborta como el resto de claves y el CHANGELOG avisa de la compatibilidad con versiones anteriores.
- [ ] Con una instancia GitLab declarada en un subpath, `finish --merge-request` deduce el proyecto (`grupo/subgrupo/repo`) quitando la URL base a la de origin, tanto en https como en ssh, y abre el MR contra la rama base.
- [ ] El segundo `finish` consulta el estado del MR en esa misma instancia y cierra o aborta con las mismas reglas que en la 0.6.0 (merged, abierto, cerrado, no se puede saber, commits sin integrar).
- [ ] Si `glab` no funciona contra una instancia en subpath, la tarea lo deja demostrado con `glab` real y el camino elegido en el plan (API REST o alternativa) lo cubre; el token sale de una variable de entorno y nunca se imprime ni se escribe.
- [ ] Sin token, sin CLI o con la instancia inalcanzable, aborta antes de subir nada con un mensaje que dice que configurar.
- [ ] Ninguna URL con credenciales ni ningun token aparece en la salida, en `tarea.md` ni en los commits.
- [ ] La skill `finish` y el README del plugin explican como configurar un GitLab autoalojado, sin mencionar el proyecto ni rutas internas.
- [ ] Tests contra repos Git temporales reales y un remoto bare, con el doble de `gh`/`glab` de la suite (`test/helpers/plataforma-doble.ts`) ampliado para registrar `GITLAB_HOST` y `-R`: cubren gitlab.com sin config, GitLab en dominio propio, GitLab bajo una ruta (https y ssh), base que no encaja con origin, URL con credenciales y `GITLAB_HOST` heredado del entorno.
- [ ] Una clave desconocida en `.taskcode/config.yml` da un aviso y se ignora en lugar de abortar (las conocidas con valor invalido siguen abortando), con test.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-08T10:47:36Z | plan | manual | persona |
| 2026-10-08T11:08:05Z | approve | manual | persona |
| 2026-10-08T11:08:06Z | start | manual | persona |
| 2026-10-08T13:05:46Z | review | manual | persona |
