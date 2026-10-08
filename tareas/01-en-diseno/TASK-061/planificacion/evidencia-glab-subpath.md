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

Pendiente: probarlo contra el GitLab real del IECA. Desde la maquina de
desarrollo no se llega (UND_ERR_CONNECT_TIMEOUT: hace falta red corporativa
o VPN).
