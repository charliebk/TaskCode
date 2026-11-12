# Cierre y release: `finish` y `doctor-deploy`

El cierre de una tarea (merge normal o merge request, GitLab propio) y la
comprobación previa a publicar una aplicación. Volver al [README del plugin](../README.md).

## `taskctl finish`

`taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--sin-verificacion] [--push]` cierra la
tarea. Sin los flags nuevos hace lo de siempre: merge `--no-ff` con el script de
Git-Flow del tipo y tarea a `terminada`.

- `--tag <nombre>` pone un tag **anotado** (mensaje = título de la tarea) sobre
  el commit de merge, que se calcula de forma explícita y no es `HEAD` (tras el
  merge hay un commit de cierre encima). El nombre se valida **antes** de
  mergear: `git check-ref-format "refs/tags/<nombre>"`, sin `-` inicial, y que no
  exista en local ni en `origin` (con origin caído y `--push`, aborta; sin
  `--push`, avisa). En un reintento (el merge ya está hecho) un tag que apunta
  al merge de esa tarea se salta y uno ajeno aborta. **Solo se sube con
  `--push`**, y solo si la rama destino ya está en origin con ese commit; sin
  `--push` la salida dice que el tag quedó solo en local. En hotfix y release
  `--tag` pasa a `merge-hotfix-to-main.sh` / `merge-release-to-main.sh`, que
  aceptan `--tag <nombre>` y lo usan en lugar del calculado: sigue habiendo un
  solo tag. `finish --push` no sube `main` (se avisa), así que en un hotfix el
  tag solo se sube si `main` ya estaba en origin con el merge.
- `--merge-request` (solo feature y fix) **no mergea**: sube la rama (siempre,
  aunque no pases `--push`: sin ella no hay merge request, y la salida lo dice),
  abre un pull request (`origin` en `github.com`, con `gh`) o un merge request
  (host que contiene «gitlab», con `glab`) contra la rama
  base, anota su URL en una sección `## Merge request` de `tarea.md`, la
  commitea en la rama de la tarea y la deja en `en-revision`. Un host de origin
  desconocido **aborta** nombrando qué configurar: no se supone GitLab (un
  GitLab propio se declara en el config, ver «GitLab propio» abajo). Antes
  de subir nada se comprueba que hay `origin`, que el CLI está instalado y que
  tiene sesión (`gh auth status` / `glab auth status`; con la plataforma
  declarada en el config, `glab api user`); cada fallo dice qué
  instalar o configurar. Antes de crear se busca un PR/MR abierto de esa rama
  para no duplicarlo. La URL de `origin` (puede llevar credenciales) no se
  imprime ni se escribe en ningún sitio.
- **Segundo `finish`** (`taskctl finish TASK-NNN --merge-request [--tag <n>]`;
  el flag es opcional si `tarea.md` ya tiene la sección `## Merge request`):
  pregunta a la plataforma por el estado del PR/MR **por nombre de rama**. Si
  está `merged` (con merge, squash o rebase: no se exige ancestría) hace
  `fetch`, comprueba que el commit resultante está en `origin/<base>`, avanza la
  base local con fast-forward, mueve la tarea a `terminada` y regenera
  CHANGELOG, INDEX y BOARD; con `--tag`, el tag va sobre el commit que la
  plataforma da como resultado del merge. Si sigue abierto, o se cerró sin
  mergear, o no se puede saber (red, error del CLI), aborta sin tocar nada.
- `.taskcode/config.yml` admite `cierre_por_defecto: merge | merge-request`
  (por defecto `merge`). `taskctl finish` **no** la lee: la usa la skill
  `finish` en modo automático, que no pregunta, a través de `taskctl siguiente
  --json` (campo `cierre`). En manual y semiautomático la skill pregunta.
  Un valor mal escrito aborta. Una clave que el plugin no conoce **avisa** por
  stderr y se ignora (desde la 0.7.0; las versiones anteriores abortaban).

#### GitLab propio (autoalojado, con dominio propio o bajo una ruta)

Sin configuración, `--merge-request` reconoce `github.com` y los hosts que
contienen «gitlab». Para cualquier otra instancia de GitLab se declara en
`.taskcode/config.yml` (claves leídas desde la 0.7.0):

```yaml
plataforma_remota: gitlab
url_base_remoto: https://git.empresa.com            # opcional
# url_base_remoto: https://servidor.example/ruta/gitlab   # si la instancia cuelga de una ruta
```

- `plataforma_remota`: `github` o `gitlab`. Sola con `gitlab`, la base es
  `https://<host de origin>` (vale para un GitLab con dominio propio en la raíz
  del host).
- `url_base_remoto` (solo con `gitlab`): la URL **https** de la instancia, con su
  ruta si la tiene, sin usuario ni contraseña. Lo que queda de `origin` tras la
  base es el proyecto (`grupo/subgrupo/repo`), que se pasa a `glab` con `-R`.
  Con **https**, la base tiene que ser **prefijo exacto** de la URL de `origin`
  (host, puerto y ruta, sin barra final). Con **ssh o scp** solo se exige el
  mismo host (el puerto no se compara): GitLab con ruta de instancia sirve ssh
  sin ella (`git@servidor.example:grupo/repo.git`), así que si la ruta de
  `origin` empieza por la de la base se quita
  (`git@servidor.example:ruta/gitlab/grupo/repo.git` -> `grupo/repo`) y si no,
  la ruta entera es el proyecto. Si no encaja, o si hay `@` (credenciales), no
  es https o hay una URL sin plataforma, `taskctl` aborta antes de subir nada
  con un mensaje que nombra la clave.
- Sesión: `glab auth login --hostname git.empresa.com` (con ruta:
  `--hostname servidor.example/ruta/gitlab`), o la variable de entorno
  `GITLAB_TOKEN`. La sesión se comprueba con `glab api user`. El token no se
  imprime ni se escribe. `glab` solo habla https con la instancia; un
  certificado propio se resuelve en el sistema o en la configuración de `glab`.
- Con la plataforma declarada el merge request se crea con la API
  (`glab api projects/<proyecto>/merge_requests`), no con `glab mr create`:
  este último exige que un remoto de Git corresponda a `GITLAB_HOST` y con una
  instancia bajo una ruta falla siempre. Con origin `http://host:puerto` hay
  que declarar `url_base_remoto` (glab solo habla https).
- Con la plataforma declarada, cada llamada a `glab` lleva `GITLAB_HOST` fijado
  a la base y se ignoran los `GITLAB_HOST`, `GL_HOST`, `GITLAB_URI` y
  `GITLAB_API_HOST` del entorno, para que un host heredado no abra el merge
  request en otro servidor.
- El config se lee del árbol en el que se ejecuta `finish`: tiene que estar
  **commiteado en la rama de la tarea y en la rama base** (el segundo `finish`
  puede ejecutarse desde la base).

## `taskctl doctor-deploy`

`taskctl doctor-deploy [--json] [--escribir] [--resultado <fichero.json>] [--crear-tareas]`
es otro comando, distinto de `doctor`: aquel comprueba que el proyecto está listo
para trabajar con el flujo de tareas; este, que **la aplicación está lista para
publicarse** sin agujeros conocidos (claves expuestas, secretos en git, RLS,
cookies, HTTPS, dependencias vulnerables...). Sin `--crear-tareas` solo lee. La
skill `/taskcode-plugin:doctor-deploy` lo encadena con un agente revisor para los
puntos de juicio (ver «Puntos de juicio» más abajo).

- **Tipo de aplicación**: lo detecta por ficheros marcadores (Node con npm,
  pnpm o yarn, Rust, Python, Java con Maven o Gradle, .NET, Go, PHP, Ruby, Docker
  y frontend web), hasta tres carpetas de profundidad y sin mirar `node_modules`,
  `vendor`, `target`, `dist` ni `build`, y lo muestra. Los tipos y sus marcadores
  son datos del catálogo (`tipo_N_*`): añadir uno no toca código. Si no detecta
  ninguno, lo dice (los puntos que dependen de un tipo salen NO APLICA).
- **Clase de aplicación** (segundo eje, independiente del lenguaje): web, api,
  android, ios, flutter, react-native, cli o libreria, con los marcadores de la
  familia `aplicacion_N_*` del catálogo (`id`, `nombre`, `marcadores` y,
  opcional, `contiene`: textos que debe contener el fichero marcador; un
  `package.json` es `cli` si contiene `"bin"`). Sale como «Aplicacion
  detectada», con el fichero que la decidió. Además de los frameworks, cuentan
  como api las señales de servicio que no dependen de él: `EXPOSE` en un
  Dockerfile, `ports:` en un compose o `web:` en un Procfile; una CLI que además
  sirve HTTP sale cli y api, y los puntos aplican. Un punto puede declarar
  `punto_N_aplicaciones: [web, api, ...]`: se combina con `punto_N_tipos` con
  Y, y dentro de cada lista basta con uno. **Si no se detecta ninguna clase, el
  punto aplica**; solo sale NO APLICA si se detecta alguna y ninguna está en la
  lista, con el tipo y el marcador en el motivo. Hoy eso apaga los puntos de
  servicio desplegado (https-obligatorio, cookies-seguras, security-headers,
  rate-limits, backups-y-migraciones, health-check, proteccion-de-bots,
  limitar-respuestas-api, cors-restringido y proteccion-csrf) en una CLI o una
  librería sin marcadores de web ni de api. Un id desconocido o del eje
  equivocado aborta, también en `.taskcode/doctor-deploy.yml`.
- **Catálogo**: `scripts/doctor-deploy.yml` (formato plano `punto_N_*`, con
  `total_puntos`). 43 puntos: los 20 pedidos, los medibles que faltaban y los de
  dominio. Cada uno tiene `id`, `severidad`, `tipos`, `metodo` (`determinista` o
  `juicio`), `sonda` (solo los deterministas), `arreglo`, `descripcion` y
  `referencia` opcional, con la categoría del OWASP Top 10 2025 y el capítulo
  del ASVS 5.0 que lo cubren (`OWASP Top 10 2025 Axx; ASVS 5.0 Vnn`);
  licencias-de-dependencias no la lleva porque ninguno de los dos trata
  licencias.
- **Cuatro estados**: `OK` (con evidencia: nunca OK sin ella), `FALLA` (con
  evidencia —fichero y línea, o commit— y el arreglo del catálogo), `NO VERIFICADO`
  (diciendo qué falta: una herramienta, o la revisión con juicio) y `NO APLICA`
  (con el motivo). Sale con **0 sin FALLA y 1 con alguna**. Un NO VERIFICADO no
  cambia el código de salida, pero el resumen dice «N de M sin verificar»: salir
  con 0 no significa «listo para publicar».
- **Qué comprueba de forma determinista** (trece sondas; todo lo demás
  es de juicio y sale NO VERIFICADO hasta que se revise con criterio):
  secretos en el árbol; secretos en **todo el historial** de git (todas las
  ramas, etiquetas y refs; un clon superficial, un desbordamiento de límites o un
  corte dan NO VERIFICADO, nunca OK); ficheros de secretos versionados (`.env`,
  claves privadas, credenciales; `.env.example` y `.env.sample` no cuentan); que
  el `.gitignore` cubre `.env` (en **cada** carpeta de proyecto: en un monorepo
  con más de 10 se comprueban todas, hasta un tope de 200; pasado el tope el
  punto sale NO VERIFICADO diciendo cuántas faltan, nunca OK); lockfile versionado; y la auditoría de
  dependencias con la herramienta del ecosistema **si está instalada**
  (`npm`/`pnpm`/`yarn audit`, `cargo audit`, `pip-audit`, `dotnet list package
  --vulnerable`, `govulncheck`; `gitleaks` opcional para el historial). Solo
  dependencias de runtime donde la herramienta lo permite; FALLA desde severidad
  alta o crítica y el resto se lista sin fallar; una herramienta que no publica
  severidad se trata como alta. Sin la herramienta, con timeout, con un código de
  salida inesperado o con una salida que no se entiende: NO VERIFICADO.
- **Sondas de configuración** (puntos 37–43, sobre los ficheros versionados):
  reglas de Firebase abiertas (`allow ... : if true`, `allow` sin condición,
  modo de prueba por fecha, `".read": true`); tablas de `supabase/migrations/`
  sin `enable row level security` en ninguna migración del conjunto;
  credenciales literales en `.npmrc`, `.pypirc` y `settings.xml` de Maven
  (`${NPM_TOKEN}`, `${env.X}` y las cifradas no cuentan); contraseñas y tokens
  literales en `docker-compose*.yml`/`compose*.yaml` (`${X}` y `*_FILE` sí
  valen); flujos con `pull_request_target` que traen el código del PR; acciones
  de terceros sin fijar a un SHA de 40 caracteres (las de `actions/`, `github/`,
  las locales y `docker://` no cuentan); y Dockerfile cuya etapa final corre
  como root o con `ADD <url>` sin `--checksum`. Sin ficheros que revisar, el
  punto sale NO APLICA con el motivo; un fichero ilegible o mayor que el límite
  lo deja en NO VERIFICADO. Un token que ya da FALLA en `secretos-en-arbol` no
  se cuenta otra vez en `tokens-en-ficheros-de-gestor`. Cada hallazgo se
  silencia con `patron` + `fichero` + `huella` (en `pr-target-checkout`, una por
  paso del flujo); `dockerfile-sin-user` es del fichero entero y se silencia sin
  huella. Estas sondas miran cualquier `Dockerfile*`, `Containerfile` o
  `compose*.yaml` versionado, aunque el tipo Docker no se detecte.
- **Claves de ejemplo y públicas**: `AKIAIOSFODNN7EXAMPLE` y `sk_test_` no cuentan,
  ni la clave `anon`/`publishable` de Supabase ni la `apiKey` `AIza...` de la
  config web de Firebase; `service_role`, `sk_live_` y una clave privada sí. El
  arreglo de un secreto que llegó a git es **rotar la clave primero** y reescribir
  el historial después.
- **El valor de un secreto nunca se muestra**: la evidencia lleva solo los 4
  primeros caracteres y la longitud (`sk_l**** (32 caracteres)`), y todo lo que
  sale (texto, JSON, informe) pasa además por una segunda red que enmascara
  cualquier clave que se cuele.
- **`--json`**: una sola línea de JSON, **versión 3** (`version`, `commit`,
  `rama`, `arbolSucio`, `tipos`, `aplicaciones`, `avisos`, `puntos`, `veredictos`, `tareas`,
  `resumen`, `codigo`). Cada punto lleva `origen`: `sonda` (lo decidió el
  comando) o `agente` (un veredicto con juicio incorporado con `--resultado`).
  `veredictos` y `tareas` son `null` si no se pidieron `--resultado` ni
  `--crear-tareas`.
- **`--escribir`**: guarda el informe en `docs/doctor-deploy/<fecha>.md` y, al
  lado, el mismo informe en `<fecha>.json` (si ya hay uno de ese día,
  `<fecha>-2`...; escritura atómica) con el commit, la rama, si el árbol estaba
  sucio, los tipos detectados y la tabla de puntos. No commitea: lo commitea la
  persona. Es un informe de uso interno sobre un commit concreto, no una
  certificación. El `.json` es lo que lee `finish` de una release.

### Puntos de juicio: `--resultado`

Los puntos de juicio (RLS, autenticación en servidor, restringir accesos, mass
assignment, consultas parametrizadas, validación de entradas, subidas de
ficheros, cookies...) no se pueden medir con certeza. Los revisa un agente
(`agents/revisor-seguridad-deploy.md`, solo lectura) lanzado por la skill
`/taskcode-plugin:doctor-deploy`, que **cita fichero y línea o deja el punto
NO VERIFICADO**. Los tipos de aplicación sin sondas propias (API, móvil, CLI,
librería) los cubre el agente como juicio.

`taskctl doctor-deploy --resultado <fichero.json>` **repite el análisis sobre
HEAD** y mezcla los veredictos con una función pura. Formato del fichero, que
vive **fuera del repositorio** (la carpeta temporal del sistema; dentro ensucia el
árbol y el comando lo avisa):

```json
{ "commit": "<sha completo>",
  "veredictos": [ { "punto": "auth-en-servidor", "estado": "ok", "fichero": "src/auth.ts", "linea": 42, "motivo": "Una frase." } ] }
```

Cada veredicto se **rechaza con su motivo** (sale en el informe y en los avisos) y
el punto se queda como estaba, NO VERIFICADO, si:

- su `commit` no es HEAD (cada veredicto lleva el commit sobre el que se juzgó;
  vale el de la raíz si el veredicto no trae el suyo, y un prefijo de 7 o más
  caracteres);
- el punto es desconocido, no aplica o está desactivado, o es **determinista**:
  el agente nunca pisa a una sonda;
- `ok` o `falla` no traen `fichero` y `linea`: la evidencia es solo eso, sin
  fragmentos de código (cualquier campo que no sea `punto`, `estado`, `commit`,
  `fichero`, `linea` o `motivo` rechaza el veredicto);
- el `fichero` es absoluto, lleva `..`, no está versionado en ese commit, es
  binario, o la `linea` no existe (se comprueba contra el commit, no contra el
  árbol de trabajo);
- hay dos veredictos para el mismo punto (los dos se rechazan).

El `motivo` se acota a 300 caracteres, sin saltos de línea y pasado por el
enmascarado de secretos antes de guardarse (lo que se escribe en
`docs/doctor-deploy/` no se puede des-subir). Un `no-verificado` del agente se
acepta sin evidencia. El código de salida cuenta las FALLA que aporta el agente.

### Una tarea por FALLA: `--crear-tareas`

Crea una tarea por cada punto en FALLA (de una sonda o del agente), con ID del
**rango reservado**: `TASK-9999`, `TASK-9998`... hacia abajo, para no chocar con
las tareas normales. El objetivo es el arreglo del catálogo (más dónde falla,
solo `fichero:linea`; el texto libre de un agente nunca se copia a una tarea) y
el criterio, que `doctor-deploy` dé OK en ese punto. Usa las piezas de `new`: un
solo `ensureBaseBranchReady` (exige el árbol limpio y **puede cambiar a la rama
base**, como `new`; lo dice) y un solo commit para todas las tareas.

- **Repetir no duplica**: cada tarea lleva la etiqueta `doctor-deploy:<id-punto>`;
  un punto con una tarea **abierta** con esa etiqueta reutiliza la existente y lo
  dice. Si ya estaba terminada y el punto vuelve a fallar, se crea otra. **Borrar
  la etiqueta a mano rompe la deduplicación** de ese punto.
- **Avisa, sin cerrar nada**, de las tareas abiertas cuyo punto ya da OK, ya no
  aplica o ya no existe.
- Con `--escribir`, las tareas se crean **antes** de escribir el informe (el
  guard de rama base aborta con ficheros sin trackear).
- Si no hay FALLA no toca la rama ni exige el árbol limpio.

El siguiente ID reservado es el menor ocupado menos uno, mirando **tareas y
ramas** (`feature/task-9999-*`): las ramas no se borran, así que un ID cuya
carpeta se borró sigue ocupado. La numeración normal (`taskctl new`/`import`)
ignora todo ID desde `TASK-9000` y aborta si llegara hasta ahí. Un compañero con
una versión anterior del plugin crearía `TASK-10000` tras un `TASK-9999`:
actualizad el plugin a la vez.

### Aviso al cerrar una release

`taskctl finish` de una tarea `release` **avisa, sin bloquear** (y nunca ejecuta
las sondas; solo lee `docs/doctor-deploy/*.json`), si:

- no hay un informe que valga: el informe más reciente cuyo `commit` es la punta
  que se cierra, o un **ancestro** con solo `docs/doctor-deploy/` o `tareas/`
  cambiados entre ambos (el informe se commitea después de generarse, así que su
  commit nunca es la punta, y la revisión, los veredictos y los costes commitean en
  `tareas/` sin tocar el código); o
- ese informe tiene alguna FALLA de un punto de severidad `critica`.

Cualquier fallo al leer (un informe ilegible, Git que no responde) se convierte en
aviso. Como `finish` exige el árbol limpio, hay que commitear el informe antes de
cerrar.

`.taskcode/doctor-deploy.yml` (opcional) ajusta el catálogo del proyecto, con el
mismo formato plano:

```yaml
# Desactivar un punto exige motivo (es una aceptación de riesgo). Sale NO APLICA.
desactivar_1_id: lockfile-versionado
desactivar_1_motivo: Es una librería: el lockfile no se versiona por convención

# Añadir un punto propio: solo de juicio, o con una sonda ya registrada.
punto_1_id: revisar-datos-personales
punto_1_severidad: alta
punto_1_tipos: [todos]
punto_1_metodo: juicio
punto_1_arreglo: Quita los datos personales de los logs
punto_1_descripcion: Los logs no llevan datos personales de clientes

# Silenciar UN hallazgo concreto (un secreto ya rotado, un falso positivo).
# patron: el que informa el punto (stripe-live, aws-access-key, fichero-secreto...).
# Un silencio es POR HALLAZGO: un hallazgo del historial se silencia con su commit
# (silenciar_N_commit); uno del árbol, con la huella de su valor (silenciar_N_huella),
# que sale en la evidencia ("huella ab12cd34ef56"). La huella es un SHA-256 sin sal: solo
# es segura para claves de alta entropia (no permite recuperarlas). Para
# url-con-credenciales no se muestra (usuario y host son conocidos y la contrasena puede ser
# debil): esa se silencia solo en el historial, con commit; en el arbol hay que quitar la
# credencial. Sin commit ni
# huella aborta (taparía también claves nuevas del mismo fichero); la huella es opcional
# con commit. Si commit o huella son solo dígitos, ponlos entre comillas.
silenciar_1_patron: stripe-live
silenciar_1_fichero: config/prod.env
silenciar_1_commit: "ab12cd34"
silenciar_1_huella: "ab12cd34ef56"
silenciar_1_motivo: Clave rotada el 2026-10-01
silenciar_1_quien: carlos
silenciar_1_fecha: 2026-10-27
```

Un `id` desconocido en `desactivar_N_id` avisa y se ignora; un `id` repetido (con
el catálogo del plugin o consigo mismo) aborta, igual que desactivar sin motivo.
Un silencio que no coincide con ningún hallazgo avisa, y el hallazgo silenciado
sigue apareciendo en la evidencia con su motivo, quién y cuándo, y cada punto de
secretos dice «N hallazgos silenciados».

Cobertura de los escaneos de claves: se leen todos los ficheros versionados (también
los que están en `build`, `dist`, `vendor`, `target` o `node_modules`) y los sin
versionar que no están ignorados fuera de esas carpetas; en el historial, todos los
blobs, sea cual sea su ruta. Un fichero UTF-16 con BOM se decodifica; los binarios
saltados se cuentan siempre. Un fichero de texto mayor de 1 MiB no se lee y deja el
punto en NO VERIFICADO (un binario grande, no). Un `requirements.txt` solo cuenta
como lockfile si fija todo con `==`, y una regla negada (`!.env`) en el `.gitignore`
es FALLA. `.env` tiene que quedar ignorado en la raíz de cada proyecto detectado (en un
monorepo, un `.gitignore` en el subdirectorio vale para su propio `.env`), y un módulo
Go sin bloque `require` no necesita `go.sum`.

Límites conocidos: si `git cat-file --batch` devolviera una salida truncada, el historial
sale NO VERIFICADO (no se pudo provocar con Git real, así que esa rama no tiene test); un
silencio solo con huella no tapa nunca un hallazgo del historial, y si el patrón y el
fichero tienen uno el comando avisa de que exige `silenciar_N_commit`.
