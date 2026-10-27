---
id: TASK-066
titulo: "Doctor-deploy A: catalogo generico y comprobaciones deterministas"
tipo: feature
sprint: 0
etiquetas: [doctor-deploy, seguridad]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-066-doctor-deploy-a-catalogo-generico-y-comp
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 592099
tokens_implementacion: 30041734
tokens_revision: 20519454
creado: 2026-10-27
actualizado: 2026-10-27
dependencias: []
---
## Objetivo

Antes de lanzar o publicar una aplicacion hace falta comprobar punto por punto que no deja agujeros conocidos (API keys expuestas, secretos en git, RLS, cookies, HTTPS, dependencias vulnerables...). Hoy no hay forma de hacerlo de manera repetible. Este comando recorre un catalogo generico de puntos que se adapta al tipo de aplicacion detectado (Node, Rust, Python, Java, .NET, Go, PHP, Ruby, Docker, frontend, API, base de datos), dice en cada punto que pasa, con evidencia, y como arreglarlo. Catalogo inicial: los 20 puntos pedidos (esconder API keys, limpiar secretos de git, solo clave publica en el cliente de la DB, RLS, cifrado de datos, auth en servidor, restringir accesos, mass assignment, cookies, hash de contrasenas, rate limits, proteccion de bots, queries parametrizadas, validacion de inputs, fuga de contenido, uploads, limitar respuestas de API, security headers, HTTPS, scan de dependencias) mas los medibles que falten (CORS, CSRF, modo debug y source maps en produccion, variables de entorno documentadas sin valores, lockfile versionado, contenedor sin root ni secretos en la imagen, logs sin datos sensibles, paginas de error sin traza, redirecciones abiertas y SSRF, caducidad de sesion, backups y migraciones, health check, licencias de dependencias, tests en verde). La parte que pide leer codigo con juicio y la creacion de tareas va en la tarea B.

## Criterios de aceptacion
- [x] taskctl doctor-deploy detecta el tipo de aplicacion por ficheros marcadores (Node npm/pnpm/yarn, Rust, Python, Java Maven/Gradle, .NET, Go, PHP, Ruby, Docker, frontend web) y lo muestra; un punto que no aplica sale NO APLICA con el motivo
- [x] El catalogo vive en scripts/doctor-deploy.yml del plugin con los 20 puntos pedidos y los anadidos; cada punto tiene id, severidad, tipos a los que aplica, como se comprueba (determinista o juicio) y como se arregla; un proyecto puede desactivar o anadir puntos en .taskcode/doctor-deploy.yml, desactivar exige motivo
- [x] Cada punto sale con uno de cuatro estados: OK, FALLA, NO VERIFICADO (diciendo que falta para verificarlo) o NO APLICA; ningun punto sale OK sin evidencia, y los de juicio salen NO VERIFICADO hasta la tarea B
- [x] Comprobaciones deterministas sin dependencias de runtime: ficheros de secretos versionados (.env, claves privadas, credenciales) y patrones de claves en el arbol y en el historial de git, .gitignore que cubre .env, lockfile versionado; y herramientas externas (gitleaks, npm/pnpm/yarn audit, cargo audit, pip-audit, dotnet list package --vulnerable, govulncheck) si estan instaladas
- [x] Cada FALLA muestra su evidencia (fichero y linea, o commit, o comando) y el arreglo del catalogo; el valor de un secreto nunca aparece en la salida, sale enmascarado
- [x] Con --json la salida pasa JSON.parse; el codigo de salida es 0 sin FALLA y 1 con alguna FALLA
- [x] Con --escribir guarda el certificado en docs/doctor-deploy/<fecha>.md con commit, rama, tipos detectados y la tabla de puntos
- [x] Tests contra repos git temporales reales: al menos Node, Rust y Python, uno con un secreto plantado solo en el historial que se detecta y otro limpio sin FALLA

## Resultado

Cerrada el 2026-10-27 en 3 rondas de revision por pares (rondas 1 y 2 cambios-solicitados; ronda 3 aprobada-con-correcciones, sin CRITICO ni IMPORTANTE). Primera mitad de doctor-deploy; la segunda es TASK-067.

**Lo entregado.**

- `taskctl doctor-deploy [--json] [--escribir]`, comando aparte de `doctor`.
- Catalogo `scripts/doctor-deploy.yml`: 43 puntos (los 20 pedidos, los anadidos y los de dominio como juicio) y 15 tipos de proyecto con sus marcadores, todo como datos. Campo opcional `referencia` (OWASP Top 10 2021).
- Capa del proyecto `.taskcode/doctor-deploy.yml`: `desactivar_N_{id,motivo}` (sin motivo aborta), puntos anadidos (solo juicio o sonda registrada) y `silenciar_N_{patron,fichero,commit,huella,motivo,quien,fecha}` por hallazgo: en el historial exige `commit`; en el arbol, `huella` (12 hex de SHA-256 del valor; no se ofrece para URL con credenciales).
- Cuatro estados (OK, FALLA, NO VERIFICADO, NO APLICA); ningun OK sin evidencia (`sanearPunto`); resumen «N de M sin verificar»; codigo 0/1 solo por FALLA.
- Seis sondas deterministas: secretos en el arbol (UTF-16 con BOM incluido), secretos en el historial (blobs unicos de todas las refs; clon superficial, fallo de `rev-list` o blob grande dan NO VERIFICADO), ficheros de secretos versionados, `.gitignore` que cubre `.env` por carpeta de proyecto (reglas negadas y reglas locales o globales dan FALLA), lockfile versionado (`requirements.txt` solo con `==`; Go sin `require` no exige `go.sum`) y dependencias vulnerables con la herramienta de cada ecosistema (solo runtime, FALLA desde alta; sin severidad publicada cuenta como alta; herramienta ausente, rota o salida no parseable: NO VERIFICADO).
- Enmascarado en origen (la evidencia no guarda el valor) y segunda red en la salida unica (stdout, JSON, informe y stderr de herramientas).
- `--escribir`: informe en `docs/doctor-deploy/<fecha>.md` (sufijo `-2`... si ya existe; escritura atomica) con commit, rama, marca de arbol sucio (que ignora `docs/doctor-deploy/`) y tabla. No commitea. Por decision de la persona (D2) se llama «informe» y no «certificado». Si falla la escritura, el analisis se imprime con un aviso.

**Suite.** 1528 tests; fallan los 5 conocidos de Windows (2 README_MISSING, symlink EPERM, chmod NTFS, CRLF).

**Revision.** Tres revisores independientes con clon propio, CLI real sobre decenas de repos temporales y mutantes en cada ronda. Ningun trozo de 8+ caracteres de un secreto en ninguna salida en las tres rondas.

- Ronda 1: 6 IMPORTANTE (falsos OK por cobertura: secretos en build/dist/vendor versionados, blob decidido por su primera ruta, UTF-16, silencio sin commit demasiado amplio, `!.env`, tres protecciones sin test) y MEN-1..6, corregidos.
- Ronda 2: IMP-7 (test de que un silencio por commit no tapa el arbol) y MEN-4, 9, 10 y 11, corregidos. Incidencia: el revisor ejecuto por error comandos en el repo original y dejo un commit con una clave de prueba falsa y un fichero sin trackear; no se subio y se deshizo con autorizacion de la persona.
- Ronda 3: sin CRITICO ni IMPORTANTE.

**Aceptados sin corregir** (el codigo mergeado es el revisado):

- MEN-7: referencias solo OWASP Top 10 2021; fijar version de Top 10 y ASVS en una tarea posterior.
- MEN-8: el resumen cuenta los desactivados como NO APLICA (cada punto si dice DESACTIVADO).
- M13: `cat-file --batch` truncado; documentado en el README, no se pudo provocar con Git real.
- MEN-12: `gitignore-cubre-env` solo mira las 10 primeras carpetas de proyecto y da OK sin avisar en un monorepo con mas. Pasa a TASK-067.
- MEN-13: protecciones nuevas sin test (aviso MEN-10 sin comprobar fichero o patron, NO VERIFICADO de `check-ignore`, `require` en comentario, evidencia con todas las carpetas). Pasa a TASK-067.

**No verificado:** timeout real de una herramienta externa en Windows, salida real de `cargo audit`/`pip-audit`/`govulncheck`, clon con mas de 200 000 blobs.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-27T14:54:55Z | plan | automatico | persona |
| 2026-10-27T15:04:26Z | approve | automatico | persona |
| 2026-10-27T15:04:26Z | start | automatico | persona |
| 2026-10-27T15:51:18Z | review | automatico | persona |
| 2026-10-27T16:51:06Z | review | automatico | persona |
| 2026-10-27T18:38:26Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-10-27T15:04:12Z | diseno | agente:a85e0b79f3f823466,a553e222406f83752,a9c25c2a34e058983,a095e5f4175dff7f9,a40ec52d0bc2abb1f | 48 | 146771 | 413734 | 31546 | 33 | 592099 |
| 2026-10-27T15:51:18Z | implementacion | agente:ad57ecf0ea89d13e7 | 140 | 520448 | 12467694 | 162391 | 5 | 13150673 |
| 2026-10-27T16:22:52Z | revision | agente:a76f6d0cfd7e65566 | 108 | 231341 | 10026579 | 46586 | 7 | 10304614 |
| 2026-10-27T16:51:05Z | implementacion | agente:dif:ad57ecf0ea89d13e7 | 84 | 694326 | 12463021 | 50759 | 6 | 13208190 |
| 2026-10-27T17:42:38Z | revision | agente:a9f73ad99de3bbdaa | 98 | 163288 | 6469404 | 38762 | 5 | 6671552 |
| 2026-10-27T18:00:23Z | implementacion | agente:dif:ad57ecf0ea89d13e7 | 22 | 747671 | 2919085 | 16093 | 1 | 3682871 |
| 2026-10-27T19:31:52Z | revision | agente:ac5a86ab0df1396eb | 60 | 515682 | 3009284 | 18262 | 2 | 3543288 |
