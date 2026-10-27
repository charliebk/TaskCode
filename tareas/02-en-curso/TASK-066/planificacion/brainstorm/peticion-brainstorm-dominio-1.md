# Peticion de brainstorm — TASK-066, rol dominio (ronda 1)

- Tarea: TASK-066 — Doctor-deploy A: catalogo generico y comprobaciones deterministas
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-27
- Rol: `brainstorm-dominio` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-dominio-1.md`

## Tu pregunta

> ¿Que sabe quien va a usar esto que no se deduce leyendo el codigo?

## Que miras

- El vocabulario real: que nombra cada cosa quien trabaja en este dominio.
- Los invariantes del negocio que ningun tipo del lenguaje impone y que aun asi no se pueden violar.
- Los casos que en el codigo son simetricos y en el negocio no lo son.
- Cuando una solucion correcta en codigo es incorrecta para quien la va a usar.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Por donde se rompe (es del rol de riesgos).
- Como se prueba (es del rol de testing).

## Enunciado de la tarea

### Objetivo

````
Antes de lanzar o publicar una aplicacion hace falta comprobar punto por punto que no deja agujeros conocidos (API keys expuestas, secretos en git, RLS, cookies, HTTPS, dependencias vulnerables...). Hoy no hay forma de hacerlo de manera repetible. Este comando recorre un catalogo generico de puntos que se adapta al tipo de aplicacion detectado (Node, Rust, Python, Java, .NET, Go, PHP, Ruby, Docker, frontend, API, base de datos), dice en cada punto que pasa, con evidencia, y como arreglarlo. Catalogo inicial: los 20 puntos pedidos (esconder API keys, limpiar secretos de git, solo clave publica en el cliente de la DB, RLS, cifrado de datos, auth en servidor, restringir accesos, mass assignment, cookies, hash de contrasenas, rate limits, proteccion de bots, queries parametrizadas, validacion de inputs, fuga de contenido, uploads, limitar respuestas de API, security headers, HTTPS, scan de dependencias) mas los medibles que falten (CORS, CSRF, modo debug y source maps en produccion, variables de entorno documentadas sin valores, lockfile versionado, contenedor sin root ni secretos en la imagen, logs sin datos sensibles, paginas de error sin traza, redirecciones abiertas y SSRF, caducidad de sesion, backups y migraciones, health check, licencias de dependencias, tests en verde). La parte que pide leer codigo con juicio y la creacion de tareas va en la tarea B.
````

### Criterios de aceptacion

````
taskctl doctor-deploy detecta el tipo de aplicacion por ficheros marcadores (Node npm/pnpm/yarn, Rust, Python, Java Maven/Gradle, .NET, Go, PHP, Ruby, Docker, frontend web) y lo muestra; un punto que no aplica sale NO APLICA con el motivo
El catalogo vive en scripts/doctor-deploy.yml del plugin con los 20 puntos pedidos y los anadidos; cada punto tiene id, severidad, tipos a los que aplica, como se comprueba (determinista o juicio) y como se arregla; un proyecto puede desactivar o anadir puntos en .taskcode/doctor-deploy.yml, desactivar exige motivo
Cada punto sale con uno de cuatro estados: OK, FALLA, NO VERIFICADO (diciendo que falta para verificarlo) o NO APLICA; ningun punto sale OK sin evidencia, y los de juicio salen NO VERIFICADO hasta la tarea B
Comprobaciones deterministas sin dependencias de runtime: ficheros de secretos versionados (.env, claves privadas, credenciales) y patrones de claves en el arbol y en el historial de git, .gitignore que cubre .env, lockfile versionado; y herramientas externas (gitleaks, npm/pnpm/yarn audit, cargo audit, pip-audit, dotnet list package --vulnerable, govulncheck) si estan instaladas
Cada FALLA muestra su evidencia (fichero y linea, o commit, o comando) y el arreglo del catalogo; el valor de un secreto nunca aparece en la salida, sale enmascarado
Con --json la salida pasa JSON.parse; el codigo de salida es 0 sin FALLA y 1 con alguna FALLA
Con --escribir guarda el certificado en docs/doctor-deploy/<fecha>.md con commit, rama, tipos detectados y la tabla de puntos
Tests contra repos git temporales reales: al menos Node, Rust y Python, uno con un secreto plantado solo en el historial que se detecta y otro limpio sin FALLA
````

## Como entregas

Escribe en `salida-brainstorm-dominio-1.md`, con estas secciones y en este orden:

- Vocabulario e invariantes que el enfoque tiene que respetar
- Donde una solucion tecnicamente correcta seria incorrecta aqui
- Lo que hace falta preguntarle a una persona antes de implementar

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **riesgos**, **testing**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
