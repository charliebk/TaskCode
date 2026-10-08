# Informe de revision — TASK-061 (ronda 1)

- Commit revisado: c07cd91199ebc87aa668176fc5fc913ea5a905a7
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/fs/merge-request.ts (abrirMergeRequest, `glab mr create` con GITLAB_HOST con ruta) |
| MENOR-1 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts (proyectoDeRemoto, ssh) |
| MENOR-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts (clave desconocida avisa) |
| MENOR-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/plataforma-remota.ts (resolverRemotoDeclarado, origin http con puerto) |

## Puerta determinista

- Clon en `C:\t\rev061`, rama de la tarea. `npm install`, `npm run build`: `git status` limpio salvo `package-lock.json` (lo toca `npm install`, restaurado); `dist/src` coincide con `src`. No hay linter aparte (`lint` es `tsc --noEmit`, pasa).
- `npm test` completo, una vez: 1291 tests, 1288 pasan, 3 fallan, exactamente los 3 conocidos de Windows (approve stat no ENOENT, plan escritura no EEXIST, plan rama base con estado distinto). Ningun otro rojo, ni EBUSY ni timing.

## Reproduccion empirica con el CLI real

`node bin/taskctl finish TASK-700 --merge-request` en repos temporales con bare real (`insteadOf`), doble de `gh`/`glab` de la suite y `ls-remote`/`rev-parse` en el bare. Resultados:

| Caso | Resultado |
|---|---|
| Sin config, gitlab.com y github.com | Identico a 0.6.0: `auth status`, sin `-R`, sin `GITLAB_HOST`. Sube y abre. |
| Sin config, host desconocido | Aborta, rama NO subida, mensaje con la clave a configurar. |
| Dominio propio, solo `plataforma_remota: gitlab` | `api user`, `GITLAB_HOST=https://git.empresa.com`, `-R grupo/sub/repo`. |
| Bajo ruta, https / ssh:// sin ruta / scp sin ruta / scp con ruta | `GITLAB_HOST` con la ruta; `-R` correcto en los cuatro (`grupo/sub/repo`, `grupo/repo`). |
| Base que no encaja (otra ruta, otro host) | Aborta antes de subir; ramaEnBare = no subida; ninguna llamada al doble. |
| Origin con `usuario:secreto@`, encajando y no encajando; scp con `tok123@` | Ni `secreto` ni `tok123` en stdout, stderr, `tarea.md`, commits ni registro del doble. |
| `GITLAB_HOST`, `gitlab_host`, `GL_HOST` heredados + `GITLAB_TOKEN` | Cada llamada lleva el `GITLAB_HOST` de la config; alias a null; token solo como `<definido>`. |
| Sin sesion / inalcanzable | Aborta antes de subir, mensaje con `glab auth login --hostname` o `GITLAB_TOKEN`; la URL con credenciales sale como `***@`. |
| Clave desconocida (`clave_nueva`, `limite_wp`) | Aviso por stderr (una vez por clave), sugiere `limite_wip`, NO aborta, abre el MR. |
| Valor invalido de clave conocida (`plataforma_remota: gitlb`) | Aborta con sugerencia, nada subido. |
| `plataforma_remota: github` con host raro | `gh auth status` / `pr ...`, sin `GITLAB_HOST`. |

Con `glab` 1.102.0 real, sin servidor (glab fuerza https; el error EOF/refused muestra la URL; sin tocar servicios reales; fichero de recuperacion creado por `mr create` borrado):

- `GITLAB_HOST`, `GL_HOST` y `GITLAB_URI` seleccionan instancia; `GITLAB_API_HOST` tambien, con una URL deformada (`https://https/...`). Los cuatro alias que se descartan estan justificados (los dos "sin verificar" si actuan).
- `glab api user`, `glab mr list -R grupo/sub/repo` y `glab api projects/<ruta%2F>/merge_requests -X POST` componen `https://127.0.0.1/ruta/gitlab/api/v4/...` correcto con `GITLAB_HOST=https://127.0.0.1/ruta/gitlab`, dentro de un repo con origin que coincide.
- `glab mr create` NO: ver IMP-1.

## Hallazgos (reproduccion)

### IMPORTANTE-1 — `glab mr create` real aborta con una instancia bajo una ruta: el caso central de la tarea no funciona
- Donde: `src/fs/merge-request.ts`, `abrirMergeRequest` (`glab mr create ... -R <proyecto>` con `GITLAB_HOST=<base con ruta>` de `contextoGlab`).
- Que pasa: `glab mr create`, aunque se le pase `-R`, comprueba que algun remoto de Git "corresponda" a `GITLAB_HOST` y compara con el host del remoto (sin ruta), no con la base con ruta. Con `GITLAB_HOST` con ruta falla SIEMPRE, sea cual sea la forma de origin. `mr list` y `api user` no tienen esa comprobacion y funcionan, asi que el doble y los tests (que no la reproducen) lo dejan pasar. `abrirMergeRequest` se ejecuta DESPUES de subir la rama: la rama queda subida y no se abre el MR, y repetir `finish` repite el fallo. Incumple el criterio 3 para ruta y el 5 ("si glab no funciona en subpath, dejarlo demostrado con glab real y que el camino lo cubra").
- Reproduccion (glab 1.102.0 real, repo con un commit y rama `feat`, `GITLAB_TOKEN` ficticio; el `try` pone origin y GITLAB_HOST):
  ```
  git remote add origin https://127.0.0.1/ruta/gitlab/grupo/sub/repo.git
  GITLAB_HOST=https://127.0.0.1/ruta/gitlab glab mr create -R grupo/sub/repo --target-branch=develop --source-branch=feat --title=t --description=d --yes
  -> ERROR None of the git remotes configured for this repository correspond to the GITLAB_HOST environment variable ... GITLAB_HOST is currently set to 127.0.0.1/ruta/gitlab Configured remotes: 127.0.0.1.
  ```
  Igual con origin `git@127.0.0.1:grupo/sub/repo.git` y con `git@127.0.0.1:ruta/gitlab/grupo/sub/repo.git`. Sin `GITLAB_HOST`: "None of the git remotes ... point to a known GitLab host". Control sin ruta (`GITLAB_HOST=https://127.0.0.1`, origin https o scp sin ruta): llega a la llamada `https://127.0.0.1/api/v4/projects/grupo%2Fsub%2Frepo`, es decir dominio propio SI funciona.
  Alternativa verificada: `GITLAB_HOST=https://127.0.0.1/ruta/gitlab glab api projects/grupo%2Fsub%2Frepo/merge_requests -X POST -f source_branch=feat -f target_branch=develop -f title=t` compone `https://127.0.0.1/ruta/gitlab/api/v4/projects/grupo%2Fsub%2Frepo/merge_requests` y no mira los remotos.
- Impacto: quien tenga GitLab bajo una ruta (el motivo de la tarea) sube la rama y se queda sin MR, con un error de glab que no dice nada de `url_base_remoto`. Dominio propio (sin ruta) no se ve afectado.
- Sugerencia: crear el MR con `glab api` POST (y leer `web_url` del JSON) cuando la base tenga ruta, o en general con instancia declarada, para no depender de la comprobacion de remotos; y, mientras no se cambie, comprobar el caso con glab real antes de subir (por ejemplo abortar con un mensaje claro) o documentar que la ruta no esta soportada. Anadir un test que haga fallar `mr create` con `GITLAB_HOST` con ruta en el doble, o un test de contenido contra glab real aislado con `GLAB_CONFIG_DIR`.

### MENOR-1 — ssh: un grupo llamado como la ruta de la base se interpreta como ruta de instancia
- Donde: `src/core/plataforma-remota.ts`, `proyectoDeRemoto`.
- Que pasa: con base `https://servidor.example/ruta/gitlab` y origin `git@servidor.example:ruta/gitlab/grupo/repo.git`, el proyecto es `grupo/repo`; si de verdad el proyecto fuera `ruta/gitlab/grupo/repo` (grupo `ruta`, subgrupo `gitlab`), `-R grupo/repo` apunta a otro proyecto de la misma instancia. Con `ruta/gitlab/repo` aborta (`proyecto-corto`): seguro. Reproducido con `ambig` (aborta) y `sub_scp_conruta` (resuelve a `grupo/repo`).
- Impacto: un `mr list` podria encontrar un MR de otro proyecto con la misma rama (cierre falso) solo si existe ese otro proyecto con esa misma rama; en `mr create`, GitLab rechazaria una rama fuente inexistente. Muy improbable.
- Sugerencia / decision: ambiguedad asumida por el orquestador y documentada en la docstring, README y CHANGELOG; no corregir. Solo se anota.

### MENOR-2 — una errata en una clave conocida ya no aborta
- Donde: `src/core/config.ts`, `parsearConfigConAvisos`.
- Que pasa: `rama_bse: main` (o `modo_flujo` mal escrito) solo avisa por stderr y se aplica el defecto. Los consumidores de config (finish, start, git-commit, siguiente...) siguen igual, no hay un consumidor que lo necesite estricto salvo la pareja de sincronizacion, que sigue abortando si falta una de las dos. El aviso nombra la clave parecida.
- Impacto: un aviso que se pierde en un flujo automatico (stderr) deja el comportamiento por defecto.
- Sugerencia: aceptado, es la decision 4 de Carlos; sin accion.

### MENOR-3 — origin `http://host:8080` con solo `plataforma_remota: gitlab` descarta el puerto
- Donde: `src/core/plataforma-remota.ts`, `resolverRemotoDeclarado` (base derivada de `partesDeOrigin`, que solo conserva el puerto con https).
- Que pasa: reproducido con `http_origin`: origin `http://servidor.example:8080/grupo/repo.git` -> `GITLAB_HOST=https://servidor.example`, `-R grupo/repo`. Como glab solo habla https, la instancia con otro puerto web se resuelve a 443.
- Impacto: raro (http con puerto web propio y sin `url_base_remoto`); fallaria en la comprobacion `api user` antes de subir, asi que no deja nada a medias.
- Sugerencia: documentar que con http hay que declarar `url_base_remoto`, o abortar cuando origin es http con puerto.

## Mutantes (fichero de test concreto, `--test-timeout=500000`)

Se ejecutan `finish-merge-request-instancia`, `remoto-declarado`, `plataforma-remota`, `integracion/config` y `config-sincronizacion`.

| Mutante | Resultado |
|---|---|
| Quitar el descarte de `GITLAB_HOST` y alias del entorno (`entornoDe`, M5) | ROJO: `GITLAB_HOST (y alias) heredados del entorno se ignoran...` |
| Quitar `o.host !== base.host` (`proyectoDeRemoto`) | ROJO, 3 tests (base de otro host https y ssh, prefijo exacto) |
| `auth status` en lugar de `api user` con instancia declarada (`comprobarCli`) | ROJO, 13 tests |
| Quitar el aborto de `url_base_remoto` con `github` (`validarRemotoCompleto`) | ROJO, 2 tests |
| No quitar la ruta de la base del proyecto (`resto = o.segmentos`) | ROJO (p. ej. la prueba ssh://) |
| Quitar la comprobacion de puerto https | ROJO, 2 tests |
| `o.puerto !== base.puerto` sin `esquema === 'https'` | verde: mutante equivalente (`partesDeOrigin` ya pone `puerto = null` fuera de https), no hay hueco |

Todos restaurados (`git checkout`, `dist` recompilado, clon limpio).

## Otros puntos comprobados sin hallazgo

- `finish.ts` sin tocar; los consumidores de `resolverConfig` solo leen su campo; no hay otro consumidor de `CLAVES_CONFIG` fuera de `config.ts`.
- La skill `finish` y el README del plugin no nombran el proyecto ni rutas/organizaciones concretas (solo `git.empresa.com`, `servidor.example`, `.taskcode/config.yml`).
- Fuga de credenciales: ninguna en salida, `tarea.md`, commits ni registro del doble, con https, scp y ssh.
- Nota: el aviso de clave desconocida imprime la ruta absoluta del config, sin datos sensibles.
