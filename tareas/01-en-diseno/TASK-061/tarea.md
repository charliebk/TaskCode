---
id: TASK-061
titulo: "Merge request en GitLab autoalojado, tambien en subpath"
tipo: feature
sprint: 8
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-061-merge-request-en-gitlab-autoalojado-tamb
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-10-08
actualizado: 2026-10-08
dependencias: []
---
## Objetivo

El repo es publico y el plugin lo usaran mas personas, muchas con GitLab (Carlos, 2026-10-08). Los scripts de Git-Flow y `taskctl` ya son independientes de la plataforma (solo hablan con `origin` por Git), pero `taskctl finish --merge-request` (0.6.0) solo reconoce GitLab si el host de origin contiene "gitlab": un GitLab autoalojado con otro host, o instalado en un subpath como el del IECA (https://www.ieca.junta-andalucia.es/institutodeestadisticaycartografia/gitlab/<grupo>/<repo>.git), aborta con "host desconocido". Hay que poder declarar la plataforma y la URL base de la instancia en `.taskcode/config.yml`, que el merge request funcione contra esa instancia (con `glab` si soporta la instancia en subpath; si no, por la API REST de GitLab con un token del entorno, decision de Carlos en el plan) y que todo lo demas siga igual cuando no se declara nada.

## Criterios de aceptacion
- [ ] Sin configuracion nueva, `finish --merge-request` se comporta exactamente como en la 0.6.0 (deteccion por host; la suite existente de finish-merge-request sigue en verde sin cambiar expectativas).
- [ ] `.taskcode/config.yml` permite declarar la plataforma (`github` o `gitlab`) y la URL base de la instancia; un valor invalido aborta como el resto de claves y el CHANGELOG avisa de la compatibilidad con versiones anteriores.
- [ ] Con una instancia GitLab declarada en un subpath, `finish --merge-request` deduce el proyecto (`grupo/subgrupo/repo`) quitando la URL base a la de origin, tanto en https como en ssh, y abre el MR contra la rama base.
- [ ] El segundo `finish` consulta el estado del MR en esa misma instancia y cierra o aborta con las mismas reglas que en la 0.6.0 (merged, abierto, cerrado, no se puede saber, commits sin integrar).
- [ ] Si `glab` no funciona contra una instancia en subpath, la tarea lo deja demostrado con `glab` real y el camino elegido en el plan (API REST o alternativa) lo cubre; el token sale de una variable de entorno y nunca se imprime ni se escribe.
- [ ] Sin token, sin CLI o con la instancia inalcanzable, aborta antes de subir nada con un mensaje que dice que configurar.
- [ ] Ninguna URL con credenciales ni ningun token aparece en la salida, en `tarea.md` ni en los commits.
- [ ] La skill `finish` y el README del plugin explican como configurar un GitLab autoalojado, sin mencionar el proyecto ni rutas internas.
- [ ] Tests contra repos Git temporales reales y un remoto bare: con el doble de `gh`/`glab` de la suite y, si se usa la API REST, un servidor HTTP local de prueba que imita los endpoints de merge requests (el unico doble nuevo admitido).

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-08T10:47:36Z | plan | manual | persona |
