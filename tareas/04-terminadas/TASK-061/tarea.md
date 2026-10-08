---
id: TASK-061
titulo: "Merge request en cualquier GitLab, tambien autoalojado"
tipo: feature
sprint: 8
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-061-merge-request-en-gitlab-autoalojado-tamb
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 394880
tokens_implementacion: 28231232
tokens_revision: 7413148
creado: 2026-10-08
actualizado: 2026-10-08
dependencias: []
---
## Objetivo

El plugin tiene que funcionar en cualquier proyecto con el repo en GitHub o en GitLab (decision de Carlos, 2026-10-08: el repo es publico y lo usara mas gente). Los scripts de Git-Flow y `taskctl` ya son independientes de la plataforma (solo hablan con `origin` por Git). Lo unico atado a la plataforma es `taskctl finish --merge-request` (0.6.0), que reconoce github.com y los hosts que contienen "gitlab" (como gitlab.com), y aborta con "host desconocido" ante cualquier GitLab autoalojado con otro dominio (`git.empresa.com`) o instalado bajo una ruta (`https://servidor/ruta/gitlab`). Hay que poder declarar la plataforma y la URL base de la instancia en `.taskcode/config.yml` para que el merge request funcione contra cualquier GitLab, y que todo siga igual cuando no se declara nada.

## Criterios de aceptacion
- [x] Sin configuracion nueva, `finish --merge-request` se comporta exactamente como en la 0.6.0 (deteccion por host; la suite existente de finish-merge-request sigue en verde sin cambiar expectativas).
- [x] `.taskcode/config.yml` permite declarar la plataforma (`github` o `gitlab`) y la URL base de la instancia; un valor invalido aborta como el resto de claves y el CHANGELOG avisa de la compatibilidad con versiones anteriores.
- [x] Con una instancia GitLab declarada en un subpath, `finish --merge-request` deduce el proyecto (`grupo/subgrupo/repo`) quitando la URL base a la de origin, tanto en https como en ssh, y abre el MR contra la rama base.
- [x] El segundo `finish` consulta el estado del MR en esa misma instancia y cierra o aborta con las mismas reglas que en la 0.6.0 (merged, abierto, cerrado, no se puede saber, commits sin integrar).
- [x] Si `glab` no funciona contra una instancia en subpath, la tarea lo deja demostrado con `glab` real y el camino elegido en el plan (API REST o alternativa) lo cubre; el token sale de una variable de entorno y nunca se imprime ni se escribe.
- [x] Sin token, sin CLI o con la instancia inalcanzable, aborta antes de subir nada con un mensaje que dice que configurar.
- [x] Ninguna URL con credenciales ni ningun token aparece en la salida, en `tarea.md` ni en los commits.
- [x] La skill `finish` y el README del plugin explican como configurar un GitLab autoalojado, sin mencionar el proyecto ni rutas internas.
- [x] Tests contra repos Git temporales reales y un remoto bare, con el doble de `gh`/`glab` de la suite (`test/helpers/plataforma-doble.ts`) ampliado para registrar `GITLAB_HOST` y `-R`: cubren gitlab.com sin config, GitLab en dominio propio, GitLab bajo una ruta (https y ssh), base que no encaja con origin, URL con credenciales y `GITLAB_HOST` heredado del entorno.
- [x] Una clave desconocida en `.taskcode/config.yml` da un aviso y se ignora en lugar de abortar (las conocidas con valor invalido siguen abortando), con test.

## Resultado

Cerrada el 2026-10-08 en 2 rondas de revision por pares.

**Lo entregado.** `taskctl finish --merge-request` funciona con cualquier
GitLab, de dominio propio o bajo una ruta.

- **Config.** Dos claves validadas juntas en `.taskcode/config.yml`:
  `plataforma_remota` (`github` | `gitlab`) y `url_base_remoto` (opcional;
  solo https y sin userinfo).
- **Glab.** Desde un unico punto (`contextoGlab`) recibe:
  - `GITLAB_HOST=<base>` fijado explicitamente, ignorando `GITLAB_HOST`,
    `GL_HOST`, `GITLAB_URI` y `GITLAB_API_HOST` heredados;
  - `-R <proyecto relativo a la base>`.
- **Sesion.** Se comprueba con `glab api user`, que acepta `GITLAB_TOKEN` o
  `glab auth login`.
- **Creacion.** El MR se crea con
  `glab api projects/<p>/merge_requests --method=POST`, porque `glab mr
  create` no funciona con una instancia bajo una ruta.
- **Proyecto.**
  - Con origin https, prefijo exacto de host, puerto y ruta.
  - Con ssh o scp basta el mismo host, porque GitLab sirve ssh sin la ruta de
    la instancia. Si la ruta de origin empieza por la de la base, se quita.
- **Sin declaracion,** todo como en la 0.6.0.
- **Claves desconocidas.** Una clave desconocida en la config ahora avisa y se
  ignora en vez de abortar. Con el repo publico, una version nueva no puede
  dejar sin `taskctl` a quien no haya actualizado. Las claves conocidas con
  un valor invalido siguen abortando.

**Ajuste sobre el plan.** El plan pedia prefijo exacto tambien para ssh. El
implementador senalo que GitLab con `relative_url_root` sirve ssh sin la
ruta, y el orquestador cambio la regla de ssh a «mismo host». El revisor de la
ronda 1 lo juzgo y lo acepto.

**Evidencia con glab real** (`planificacion/evidencia-glab-subpath.md`, cuatro
pruebas): glab respeta la ruta con `GITLAB_HOST` y `-R` relativo, `auth
status` ignora `GITLAB_TOKEN`, `api user` lo usa, y la creacion por API
compone bien la URL. Sin probar: TLS con una CA real, y Linux y macOS.

**Revision por pares.**

- *Ronda 1* (cambios-solicitados).
  - **IMP-1, reproducido con glab real:** `glab mr create` aborta siempre con
    `GITLAB_HOST` bajo una ruta, porque compara los remotos de Git, y lo hacia
    despues de subir la rama. El doble no lo veia. Corregido: la creacion va
    por `glab api`, y el doble imita ahora esa comprobacion de glab real.
  - **MENOR-1 (aceptado):** ambiguedad por ssh si un grupo de primer nivel se
    llama como la ruta de la base.
  - **MENOR-2 (aceptado):** una errata en una clave conocida solo avisa, por la
    decision 4.
  - **MENOR-3 (corregido):** origin `http://host:puerto` con solo
    `plataforma_remota` aborta antes de subir y pide `url_base_remoto`.
- *Ronda 2* (aprobada, sin hallazgos nuevos). Verificada de punta a punta con
  glab 1.102 real contra un servidor HTTPS local: en subpath con origin https
  y scp, reintento tras un 500 de la API sin duplicar, y titulo con `-`,
  comillas, `$()`, `%PATH%`, `@` y ñ.
- *Mutantes:* M1 a M14 del implementador y 13 de los revisores (uno
  equivalente), el resto muertos.
- *Suite completa:* 1292 de 1295, con los 3 rojos conocidos de Windows.

**Coste:** diseno 0,4 M, implementacion 28,2 M y revision 7,4 M.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-08T10:47:36Z | plan | manual | persona |
| 2026-10-08T11:08:05Z | approve | manual | persona |
| 2026-10-08T11:08:06Z | start | manual | persona |
| 2026-10-08T13:05:46Z | review | manual | persona |
| 2026-10-08T14:28:12Z | review | manual | persona |
| 2026-10-08T14:55:30Z | finish | manual | persona |
