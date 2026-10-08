# Evidencia: glab contra una instancia GitLab en subpath (2026-10-08)

Probado con glab 1.102.0 (Windows) contra un servidor HTTP local que registra
las peticiones. Se uso `GITLAB_TOKEN` ficticio. El servidor era http y glab
fuerza https, asi que todas acaban en EOF, pero el mensaje de error muestra la
URL exacta que glab compone.

Resultados con `GITLAB_HOST=https://127.0.0.1:P/sub/gitlab`:

- **`glab api version`** llama a `https://127.0.0.1:P/sub/gitlab/api/v4/version`.
  **Respeta el subpath.**
- **`glab mr list -R grupo/sub/repo`** llama a
  `https://127.0.0.1:P/sub/gitlab/api/v4/projects/grupo%2Fsub%2Frepo/merge_requests?...`.
  **Es correcto:** el proyecto es la ruta relativa a la URL base de la
  instancia.
- **`glab mr list -R 127.0.0.1:P/sub/gitlab/grupo/sub/repo`** codifica el
  host como parte del proyecto. **Es incorrecto.**
- **`glab mr list -R https://127.0.0.1:P/sub/gitlab/grupo/sub/repo`** pierde
  el subpath (`/api/v4/projects/sub%2Fgitlab%2F...`). **Es incorrecto.**
- **glab usa https** aunque `GITLAB_HOST` diga http.

Conclusion: no hace falta la API REST. Con glab basta con:

1. `GITLAB_HOST` igual a la URL base de la instancia, con su subpath.
2. `-R` igual a la ruta del proyecto relativa a esa base, que se deduce
   quitando la base a la URL de origin (https o ssh).


## Segunda prueba: autenticacion y creacion (2026-10-08)

Mismo montaje, con `GITLAB_HOST=https://127.0.0.1:P/sub/gitlab`:

- **`glab auth status`**, con `GITLAB_HOST` o con `--hostname
  127.0.0.1:P/sub/gitlab`:
  - glab trata `host/subpath` como el nombre de la instancia y propone
    `glab auth login --hostname 127.0.0.1:P/sub/gitlab`;
  - **ignora `GITLAB_TOKEN`**: dice «not authenticated» aunque la variable
    exista;
  - consecuencia: el preflight no puede basarse solo en `auth status` si se
    admite el token por entorno. Las opciones son exigir
    `glab auth login --hostname <host/subpath>` o comprobar la sesion con una
    llamada real, `glab api user`, que si usa el token.
- **`glab mr create -R grupo/sub/repo ...`** fuera de un repo Git falla con
  `not a git repository`, porque glab necesita un repo en el cwd, que en uso
  real lo es. Ademas deja un fichero de recuperacion en
  `%LOCALAPPDATA%/glab-cli/recover/<proyecto>/mr.json`: los tests deben
  aislarlo, porque el doble no lo crea, pero glab real si.

## Tercera prueba: `glab api user` como comprobacion de sesion (2026-10-08)

- **Con `GITLAB_TOKEN`:** `glab api user` llama a
  `https://127.0.0.1:P/sub/gitlab/api/v4/user`. Usa el token del entorno y
  respeta el subpath.
- **Sin token:** falla al momento con `Unauthenticated`, sin llamar a la red.

Por tanto, `glab api user` sirve como preflight de sesion con token por
entorno o con `glab auth login --hostname <host/subpath>`. `auth status` no
sirve, porque ignora el token.
