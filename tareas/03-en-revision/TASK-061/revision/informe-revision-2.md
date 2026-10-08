# Informe de revision — TASK-061 (ronda 2)

- Commit revisado: cb569d5681ba5c74f59fd7871214df971496cedb
- Revisor: code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-061 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts (abrirMergeRequest, creacion por `glab api`) |
| MENOR-1 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts (proyectoDeRemoto, ssh) |
| MENOR-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts (clave desconocida avisa) |
| MENOR-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts (resolverRemotoDeclarado, origin http con puerto) |

Hallazgos nuevos de esta ronda: ninguno (sin hallazgos).

## Puerta determinista

- Clon en `C:\t\rev061r2`, rama de la tarea. `npm install` y `npm run build`: `git status` limpio salvo `package-lock.json` (lo toca `npm install`; restaurado).
- `npm test` completo, una vez: 1295 tests, 1292 pasan, 3 fallan, exactamente los 3 conocidos de Windows (approve stat no ENOENT, plan escritura no EEXIST, plan rama base con estado distinto). Ningun otro rojo, ni EBUSY ni timing.

## Reproduccion empirica con glab REAL (1.102.0)

Montaje: servidor HTTPS propio (Node, certificado autofirmado, `127.0.0.1:443`) que imita `/ruta/gitlab/api/v4/{user,projects/grupo%2Fsub%2Frepo/merge_requests}` y registra cada peticion; `GLAB_CONFIG_DIR` temporal con `skip_tls_verify`; `GITLAB_TOKEN` ficticio. Se ejecuta `runFinishCommand` (el codigo de `taskctl finish --merge-request`, compilado) sobre repos temporales con bare real y SIN el doble de la suite en el PATH, es decir, con el `glab` de la maquina. No se toco la config de glab del usuario ni se uso ningun servicio real. En `%LOCALAPPDATA%/glab-cli/recover` solo queda `charlie.bk/` (ya existia): la creacion por API no deja fichero de recuperacion.

| Caso | Resultado |
|---|---|
| A. origin `https://127.0.0.1/ruta/gitlab/grupo/sub/repo.git` + `url_base_remoto` con ruta | 1er finish: `GET user`, `GET .../merge_requests?source_branch=` (preflight de estado), `POST /ruta/gitlab/api/v4/projects/grupo%2Fsub%2Frepo/merge_requests`; MR abierto, URL `https://127.0.0.1/ruta/gitlab/grupo/sub/repo/-/merge_requests/1` leida de `web_url`. 2o finish: `user` + `mr list -R` (estado), detecta el MR abierto y aborta "sigue abierto" sin crear otro (1 solo POST en total). |
| B. origin scp `git@127.0.0.1:grupo/sub/repo.git` (sin la ruta) + misma base | Identico a A. |
| C. la API responde 500 tras el push | 1er finish: error "ya esta subida a origin, pero glab no pudo crear el merge request ... no se duplicara"; rama en el bare. 2o finish: crea el MR (1 MR en servidor, no duplicado). |
| D. titulo `-x --flag "comillas" y 'simples' $(echo hi) %PATH% @/etc/passwd & ñ` | Llega integro como `title` y en la descripcion; ni se interpreta como flag, ni se lee `@/etc/passwd` como fichero (`--raw-field`), ni se expande el shell. |
| E. dominio propio sin ruta (`plataforma_remota: gitlab`, servidor en `/api/v4`) | Mismo camino por API; funciona. |

Regresiones: el segundo finish (estado) usa `mr list -R` como antes y no se ve afectado; sin declaracion el camino es el de la 0.6.0 (`endpointMr` queda `undefined`, se usa `gh pr create` / `glab mr create` y `urlDeSalidaDeCreacion`), y `declarado` solo se rellena para gitlab, asi que GitHub no puede tomar el camino de la API. Los mensajes del reintento siguen siendo ciertos.

## Estado de los hallazgos de la ronda 1

- **IMP-1 (corregido):** el caso central (instancia bajo una ruta, origin https o scp sin la ruta) funciona de extremo a extremo con glab real, incluido el segundo finish y el reintento tras un fallo de creacion. El doble reproduce ahora la comprobacion de remotos de `glab mr create`, y hay un test que lo contrasta con el glab real de la maquina.
- **MENOR-3 (corregido):** origin `http://host:8080` con solo `plataforma_remota: gitlab` aborta antes de subir con un mensaje que pide `url_base_remoto`; documentado en README y CHANGELOG. Con `url_base_remoto` declarada sigue funcionando.
- **MENOR-1 y MENOR-2:** aceptados en la ronda 1, sin cambios, sin accion.

## Mutantes (fichero de test concreto, `--test-timeout=500000`; ficheros `finish-merge-request-instancia`, `remoto-declarado`, `plataforma-remota`)

| Mutante | Resultado |
|---|---|
| `abrirMergeRequest` vuelve a `glab mr create` con instancia declarada | ROJO, 17 tests |
| Quitar `encodeURIComponent` del proyecto en el endpoint | ROJO, 12 tests |
| `--raw-field=title=` -> `--field=title=` | ROJO, 4 tests (incluido el del titulo raro) |
| Quitar el aborto por origin http con puerto (`puertoHttp`) | ROJO, test "origin http con puerto ... aborta antes de subir" |

Todos restaurados.

## Notas (sin accion)

- No probado: TLS con una CA real (el propio plan lo deja como no probado); la telemetria `usage_data/track_event` de glab va a la misma instancia y es propia de glab.
- `webUrlDeRespuesta` acepta `http://` o `https://` en `web_url` (`esUrlPublicable`); una instancia detras de un proxy que devuelva `http` se publica tal cual en `tarea.md`. Es informativo, igual que antes con `mr create`.
