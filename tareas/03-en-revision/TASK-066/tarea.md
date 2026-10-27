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
tokens_implementacion: 13150673
tokens_revision: 10304614
creado: 2026-10-27
actualizado: 2026-10-27
dependencias: []
---
## Objetivo

Antes de lanzar o publicar una aplicacion hace falta comprobar punto por punto que no deja agujeros conocidos (API keys expuestas, secretos en git, RLS, cookies, HTTPS, dependencias vulnerables...). Hoy no hay forma de hacerlo de manera repetible. Este comando recorre un catalogo generico de puntos que se adapta al tipo de aplicacion detectado (Node, Rust, Python, Java, .NET, Go, PHP, Ruby, Docker, frontend, API, base de datos), dice en cada punto que pasa, con evidencia, y como arreglarlo. Catalogo inicial: los 20 puntos pedidos (esconder API keys, limpiar secretos de git, solo clave publica en el cliente de la DB, RLS, cifrado de datos, auth en servidor, restringir accesos, mass assignment, cookies, hash de contrasenas, rate limits, proteccion de bots, queries parametrizadas, validacion de inputs, fuga de contenido, uploads, limitar respuestas de API, security headers, HTTPS, scan de dependencias) mas los medibles que falten (CORS, CSRF, modo debug y source maps en produccion, variables de entorno documentadas sin valores, lockfile versionado, contenedor sin root ni secretos en la imagen, logs sin datos sensibles, paginas de error sin traza, redirecciones abiertas y SSRF, caducidad de sesion, backups y migraciones, health check, licencias de dependencias, tests en verde). La parte que pide leer codigo con juicio y la creacion de tareas va en la tarea B.

## Criterios de aceptacion
- [ ] taskctl doctor-deploy detecta el tipo de aplicacion por ficheros marcadores (Node npm/pnpm/yarn, Rust, Python, Java Maven/Gradle, .NET, Go, PHP, Ruby, Docker, frontend web) y lo muestra; un punto que no aplica sale NO APLICA con el motivo
- [ ] El catalogo vive en scripts/doctor-deploy.yml del plugin con los 20 puntos pedidos y los anadidos; cada punto tiene id, severidad, tipos a los que aplica, como se comprueba (determinista o juicio) y como se arregla; un proyecto puede desactivar o anadir puntos en .taskcode/doctor-deploy.yml, desactivar exige motivo
- [ ] Cada punto sale con uno de cuatro estados: OK, FALLA, NO VERIFICADO (diciendo que falta para verificarlo) o NO APLICA; ningun punto sale OK sin evidencia, y los de juicio salen NO VERIFICADO hasta la tarea B
- [ ] Comprobaciones deterministas sin dependencias de runtime: ficheros de secretos versionados (.env, claves privadas, credenciales) y patrones de claves en el arbol y en el historial de git, .gitignore que cubre .env, lockfile versionado; y herramientas externas (gitleaks, npm/pnpm/yarn audit, cargo audit, pip-audit, dotnet list package --vulnerable, govulncheck) si estan instaladas
- [ ] Cada FALLA muestra su evidencia (fichero y linea, o commit, o comando) y el arreglo del catalogo; el valor de un secreto nunca aparece en la salida, sale enmascarado
- [ ] Con --json la salida pasa JSON.parse; el codigo de salida es 0 sin FALLA y 1 con alguna FALLA
- [ ] Con --escribir guarda el certificado en docs/doctor-deploy/<fecha>.md con commit, rama, tipos detectados y la tabla de puntos
- [ ] Tests contra repos git temporales reales: al menos Node, Rust y Python, uno con un secreto plantado solo en el historial que se detecta y otro limpio sin FALLA

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-27T14:54:55Z | plan | automatico | persona |
| 2026-10-27T15:04:26Z | approve | automatico | persona |
| 2026-10-27T15:04:26Z | start | automatico | persona |
| 2026-10-27T15:51:18Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-10-27T15:04:12Z | diseno | agente:a85e0b79f3f823466,a553e222406f83752,a9c25c2a34e058983,a095e5f4175dff7f9,a40ec52d0bc2abb1f | 48 | 146771 | 413734 | 31546 | 33 | 592099 |
| 2026-10-27T15:51:18Z | implementacion | agente:ad57ecf0ea89d13e7 | 140 | 520448 | 12467694 | 162391 | 5 | 13150673 |
| 2026-10-27T16:22:52Z | revision | agente:a76f6d0cfd7e65566 | 108 | 231341 | 10026579 | 46586 | 7 | 10304614 |
