# Peticion de revision — TASK-066 (ronda 1)

- Tarea: TASK-066 — Doctor-deploy A: catalogo generico y comprobaciones deterministas
- Rama revisada: feature/task-066-doctor-deploy-a-catalogo-generico-y-comp
- Rama base: develop
- Commit revisado (HEAD): 92422185bf17c7de4d5985648e803f3f44e34442
- Fecha: 2026-10-27
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-066 (criterios de aceptacion y plan)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Commits a revisar (git log develop..HEAD)

````
9242218 chore(TASK-066): coste implementacion +13150673 tokens (1 agente)
f9aba86 docs(TASK-066): README del plugin con el comando doctor-deploy
700b0da feat(TASK-066): comando taskctl doctor-deploy con --json y --escribir
95cfc80 feat(TASK-066): deteccion de tipos y las seis sondas deterministas
080a5c6 feat(TASK-066): nucleo de doctor-deploy: estados, formatos, patrones y auditoria
d803634 feat(TASK-066): catalogo de doctor-deploy y capa del proyecto
556eedd chore(TASK-066): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 9a3a757..29c09d3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -555,6 +555,93 @@ algún error (los avisos no cuentan). Comprueba:
 (`{ok, errores, avisos, comprobaciones: [{id, nivel, mensaje, arreglo}]}`), para que
 una skill la lea. `taskctl doctor` no escribe, no commitea ni cambia de rama.
 
+`taskctl doctor-deploy [--json] [--escribir]` es otro comando, distinto de
+`doctor`: aquel comprueba que el proyecto está listo para trabajar con el flujo
+de tareas; este, que **la aplicación está lista para publicarse** sin agujeros
+conocidos (claves expuestas, secretos en git, RLS, cookies, HTTPS, dependencias
+vulnerables...). Solo lee.
+
+- **Tipo de aplicación**: lo detecta por ficheros marcadores (Node con npm,
+  pnpm o yarn, Rust, Python, Java con Maven o Gradle, .NET, Go, PHP, Ruby, Docker
+  y frontend web), hasta tres carpetas de profundidad y sin mirar `node_modules`,
+  `vendor`, `target`, `dist` ni `build`, y lo muestra. Los tipos y sus marcadores
+  son datos del catálogo (`tipo_N_*`): añadir uno no toca código. Si no detecta
+  ninguno, lo dice (los puntos que dependen de un tipo salen NO APLICA).
+- **Catálogo**: `scripts/doctor-deploy.yml` (formato plano `punto_N_*`, con
+  `total_puntos`). 43 puntos: los 20 pedidos, los medibles que faltaban y los de
+  dominio. Cada uno tiene `id`, `severidad`, `tipos`, `metodo` (`determinista` o
+  `juicio`), `sonda` (solo los deterministas), `arreglo`, `descripcion` y
+  `referencia` opcional (categoría OWASP Top 10 2021).
+- **Cuatro estados**: `OK` (con evidencia: nunca OK sin ella), `FALLA` (con
+  evidencia —fichero y línea, o commit— y el arreglo del catálogo), `NO VERIFICADO`
+  (diciendo qué falta: una herramienta, o la revisión con juicio) y `NO APLICA`
+  (con el motivo). Sale con **0 sin FALLA y 1 con alguna**. Un NO VERIFICADO no
+  cambia el código de salida, pero el resumen dice «N de M sin verificar»: salir
+  con 0 no significa «listo para publicar».
+- **Qué comprueba de forma determinista** (las únicas seis sondas; todo lo demás
+  es de juicio y sale NO VERIFICADO hasta que se revise con criterio):
+  secretos en el árbol; secretos en **todo el historial** de git (todas las
+  ramas, etiquetas y refs; un clon superficial, un desbordamiento de límites o un
+  corte dan NO VERIFICADO, nunca OK); ficheros de secretos versionados (`.env`,
+  claves privadas, credenciales; `.env.example` y `.env.sample` no cuentan); que
+  el `.gitignore` cubre `.env`; lockfile versionado; y la auditoría de
+  dependencias con la herramienta del ecosistema **si está instalada**
+  (`npm`/`pnpm`/`yarn audit`, `cargo audit`, `pip-audit`, `dotnet list package
+  --vulnerable`, `govulncheck`; `gitleaks` opcional para el historial). Solo
+  dependencias de runtime donde la herramienta lo permite; FALLA desde severidad
+  alta o crítica y el resto se lista sin fallar; una herramienta que no publica
+  severidad se trata como alta. Sin la herramienta, con timeout, con un código de
+  salida inesperado o con una salida que no se entiende: NO VERIFICADO.
+- **Claves de ejemplo y públicas**: `AKIAIOSFODNN7EXAMPLE` y `sk_test_` no cuentan,
+  ni la clave `anon`/`publishable` de Supabase ni la `apiKey` `AIza...` de la
+  config web de Firebase; `service_role`, `sk_live_` y una clave privada sí. El
+  arreglo de un secreto que llegó a git es **rotar la clave primero** y reescribir
+  el historial después.
+- **El valor de un secreto nunca se muestra**: la evidencia lleva solo los 4
+  primeros caracteres y la longitud (`sk_l**** (32 caracteres)`), y todo lo que
+  sale (texto, JSON, informe) pasa además por una segunda red que enmascara
+  cualquier clave que se cuele.
+- **`--json`**: una sola línea de JSON (`version`, `commit`, `rama`, `arbolSucio`,
+  `tipos`, `avisos`, `puntos`, `resumen`, `codigo`); es el contrato que
+  extienden las tareas siguientes.
+- **`--escribir`**: guarda el informe en `docs/doctor-deploy/<fecha>.md` (si ya
+  hay uno de ese día, `<fecha>-2.md`...; escritura atómica) con el commit, la
+  rama, si el árbol estaba sucio, los tipos detectados y la tabla de puntos. No
+  commitea. Es un informe de uso interno sobre un commit concreto, no una
+  certificación.
+
+`.taskcode/doctor-deploy.yml` (opcional) ajusta el catálogo del proyecto, con el
+mismo formato plano:
+
+```yaml
+# Desactivar un punto exige motivo (es una aceptación de riesgo). Sale NO APLICA.
+desactivar_1_id: lockfile-versionado
+desactivar_1_motivo: Es una librería: el lockfile no se versiona por convención
+
+# Añadir un punto propio: solo de juicio, o con una sonda ya registrada.
+punto_1_id: revisar-datos-personales
+punto_1_severidad: alta
+punto_1_tipos: [todos]
+punto_1_metodo: juicio
+punto_1_arreglo: Quita los datos personales de los logs
+punto_1_descripcion: Los logs no llevan datos personales de clientes
+
+# Silenciar UN hallazgo concreto (un secreto ya rotado, un falso positivo).
+# patron: el que informa el punto (stripe-live, aws-access-key, fichero-secreto...).
+# commit es opcional; si es solo dígitos, ponlo entre comillas.
+silenciar_1_patron: stripe-live
+silenciar_1_fichero: config/prod.env
+silenciar_1_commit: "ab12cd34"
+silenciar_1_motivo: Clave rotada el 2026-10-01
+silenciar_1_quien: carlos
+silenciar_1_fecha: 2026-10-27
+```
+
+Un `id` desconocido en `desactivar_N_id` avisa y se ignora; un `id` repetido (con
+el catálogo del plugin o consigo mismo) aborta, igual que desactivar sin motivo.
+Un silencio que no coincide con ningún hallazgo avisa, y el hallazgo silenciado
+sigue apareciendo en la evidencia con su motivo, quién y cuándo.
+
 `taskctl metricas [--heuristica]` (solo lectura) saca una fila por tarea
 con la duración de calendario de cada fase (diseño = plan→start, curso =
 start→primer review, revisión = primer review→finish), las rondas de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/doctor-deploy.yml b/taskcode-marketplace/plugins/taskcode-plugin/scripts/doctor-deploy.yml
new file mode 100644
index 0000000..b03c1c9
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/doctor-deploy.yml
@@ -0,0 +1,436 @@
+# Catalogo de puntos del comando doctor-deploy: lo que hay que comprobar antes
+# de publicar una aplicacion para no dejar agujeros conocidos.
+#
+# FORMATO. Mismo parser minimo que el resto de metadatos del plugin: SOLO pares
+# "clave: valor" de primer nivel, listas en linea [a, b, c] y comentarios de
+# linea que empiezan por "#". Sin anidamiento: cada entrada se aplana con el
+# prefijo "tipo_N_" o "punto_N_", donde N es su posicion (empieza en 1).
+# "total_tipos" y "total_puntos" dicen cuantas entradas hay.
+#
+# TIPOS DE APLICACION (tipo_N_*). Se detectan por ficheros marcadores y son
+# datos: anadir uno no toca el codigo.
+#   - id: identificador estable (el que se usa en "tipos" de cada punto).
+#   - nombre: como se muestra.
+#   - marcadores: nombres de fichero (package.json), extensiones (*.csproj) o
+#     sufijos de ruta con "/" (public/index.html). Se buscan en los ficheros del
+#     proyecto hasta 3 carpetas de profundidad, sin node_modules, vendor, target,
+#     dist ni build.
+#
+# PUNTOS (punto_N_*).
+#   - id: identificador estable, en minusculas y con guiones.
+#   - severidad: critica | alta | media | baja.
+#   - tipos: tipos a los que aplica, o "todos". Si ninguno de esos tipos se
+#     detecta, el punto sale NO APLICA con el motivo.
+#   - metodo: "determinista" (lo comprueba el comando, con evidencia) o "juicio"
+#     (hace falta leer el codigo con criterio: sale NO VERIFICADO hasta entonces).
+#   - sonda: solo en los deterministas; nombre de la comprobacion registrada.
+#   - arreglo: como se arregla.
+#   - descripcion: que se comprueba.
+#   - referencia: opcional; categoria OWASP Top 10 2021 que lo cubre.
+#
+# Un proyecto puede desactivar o anadir puntos, y silenciar hallazgos concretos,
+# con su propio fichero de ajustes (ver la documentacion del comando).
+#
+total_tipos: 15
+total_puntos: 43
+
+tipo_1_id: node
+tipo_1_nombre: Node.js
+tipo_1_marcadores: [package.json]
+tipo_2_id: npm
+tipo_2_nombre: npm
+tipo_2_marcadores: [package-lock.json, npm-shrinkwrap.json]
+tipo_3_id: pnpm
+tipo_3_nombre: pnpm
+tipo_3_marcadores: [pnpm-lock.yaml]
+tipo_4_id: yarn
+tipo_4_nombre: yarn
+tipo_4_marcadores: [yarn.lock]
+tipo_5_id: rust
+tipo_5_nombre: Rust
+tipo_5_marcadores: [Cargo.toml]
+tipo_6_id: python
+tipo_6_nombre: Python
+tipo_6_marcadores: [pyproject.toml, requirements.txt, setup.py, setup.cfg, Pipfile, poetry.lock]
+tipo_7_id: java
+tipo_7_nombre: Java
+tipo_7_marcadores: [pom.xml, build.gradle, build.gradle.kts]
+tipo_8_id: maven
+tipo_8_nombre: Maven
+tipo_8_marcadores: [pom.xml]
+tipo_9_id: gradle
+tipo_9_nombre: Gradle
+tipo_9_marcadores: [build.gradle, build.gradle.kts]
+tipo_10_id: dotnet
+tipo_10_nombre: .NET
+tipo_10_marcadores: [*.csproj, *.fsproj, *.vbproj, *.sln]
+tipo_11_id: go
+tipo_11_nombre: Go
+tipo_11_marcadores: [go.mod]
+tipo_12_id: php
+tipo_12_nombre: PHP
+tipo_12_marcadores: [composer.json]
+tipo_13_id: ruby
+tipo_13_nombre: Ruby
+tipo_13_marcadores: [Gemfile]
+tipo_14_id: docker
+tipo_14_nombre: Docker
+tipo_14_marcadores: [Dockerfile, docker-compose.yml, docker-compose.yaml, compose.yml, compose.yaml]
+tipo_15_id: frontend
+tipo_15_nombre: Frontend web
+tipo_15_marcadores: [vite.config.js, vite.config.ts, next.config.js, next.config.mjs, next.config.ts, angular.json, svelte.config.js, nuxt.config.ts, astro.config.mjs, public/index.html]
+
+# --- Los 20 puntos de base ---------------------------------------------------
+
+punto_1_id: secretos-en-arbol
+punto_1_severidad: critica
+punto_1_tipos: [todos]
+punto_1_metodo: determinista
+punto_1_sonda: secretos-arbol
+punto_1_arreglo: Saca la clave del codigo y leela de una variable de entorno o de un gestor de secretos. Si ya estuvo en un commit o en un remoto, da la clave por comprometida: rotala primero y reescribe el historial despues.
+punto_1_descripcion: Ninguna API key, token ni clave privada escrita en los ficheros del proyecto (se distinguen las claves de ejemplo o de prueba y las que son publicas a proposito).
+punto_1_referencia: OWASP Top 10 2021 A02
+
+punto_2_id: secretos-en-historial
+punto_2_severidad: critica
+punto_2_tipos: [todos]
+punto_2_metodo: determinista
+punto_2_sonda: secretos-historial
+punto_2_arreglo: Rota la clave primero (revocala en el proveedor y emite otra): un secreto que llego a un remoto se da por comprometido. Despues, si quieres, reescribe el historial con git filter-repo o BFG y fuerza el push. Si ya la rotaste y no quieres reescribir, silencia ese hallazgo en los ajustes del proyecto, con su motivo.
+punto_2_descripcion: Ningun secreto en ningun commit de ninguna rama o etiqueta, aunque ya se haya borrado del arbol actual.
+punto_2_referencia: OWASP Top 10 2021 A02
+
+punto_3_id: ficheros-secretos-versionados
+punto_3_severidad: critica
+punto_3_tipos: [todos]
+punto_3_metodo: determinista
+punto_3_sonda: ficheros-secretos
+punto_3_arreglo: Quita el fichero del indice con git rm --cached, anadelo al .gitignore y, si llego a un remoto, rota lo que contenia. Deja un .env.example con los nombres de las variables y sin valores.
+punto_3_descripcion: Ningun fichero .env, clave privada ni de credenciales versionado (un .env.example o .env.sample sin valores reales no cuenta).
+punto_3_referencia: OWASP Top 10 2021 A05
+
+punto_4_id: gitignore-cubre-env
+punto_4_severidad: alta
+punto_4_tipos: [todos]
+punto_4_metodo: determinista
+punto_4_sonda: gitignore-env
+punto_4_arreglo: Anade .env y .env.* al .gitignore (y deja pasar .env.example con una excepcion !.env.example).
+punto_4_descripcion: El .gitignore cubre los ficheros .env, para que un secreto local no llegue a un commit por descuido.
+punto_4_referencia: OWASP Top 10 2021 A05
+
+punto_5_id: clave-publica-en-cliente-db
+punto_5_severidad: critica
+punto_5_tipos: [frontend, node]
+punto_5_metodo: juicio
+punto_5_arreglo: En el cliente usa solo la clave publica o anon de la base de datos (nunca service_role, claves de administrador ni cuentas de servicio) y protege los datos con reglas de acceso por fila.
+punto_5_descripcion: El cliente de la base de datos que va al navegador o a la app usa solo la clave publica o anon.
+punto_5_referencia: OWASP Top 10 2021 A01
+
+punto_6_id: rls-activo
+punto_6_severidad: critica
+punto_6_tipos: [todos]
+punto_6_metodo: juicio
+punto_6_arreglo: Activa la seguridad a nivel de fila en cada tabla expuesta (por ejemplo ALTER TABLE ... ENABLE ROW LEVEL SECURITY) y escribe una politica por operacion; sin politica, nadie accede.
+punto_6_descripcion: Toda tabla accesible desde el cliente tiene seguridad a nivel de fila (RLS) con politicas que limitan cada fila a quien le corresponde.
+punto_6_referencia: OWASP Top 10 2021 A01
+
+punto_7_id: cifrado-en-reposo
+punto_7_severidad: alta
+punto_7_tipos: [todos]
+punto_7_metodo: juicio
+punto_7_arreglo: Activa el cifrado en reposo de la base de datos, los discos y las copias de seguridad, y cifra a nivel de aplicacion los campos especialmente sensibles.
+punto_7_descripcion: Los datos personales o sensibles estan cifrados en reposo (base de datos, discos, copias).
+punto_7_referencia: OWASP Top 10 2021 A02
+
+punto_8_id: auth-en-servidor
+punto_8_severidad: critica
+punto_8_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend]
+punto_8_metodo: juicio
+punto_8_arreglo: Comprueba la identidad y el permiso en el servidor en cada peticion; ocultar un boton o una ruta en el cliente no protege nada.
+punto_8_descripcion: La autenticacion y la autorizacion se comprueban en el servidor, no solo en el cliente.
+punto_8_referencia: OWASP Top 10 2021 A01
+
+punto_9_id: restringir-accesos
+punto_9_severidad: alta
+punto_9_tipos: [todos]
+punto_9_metodo: juicio
+punto_9_arreglo: Aplica minimo privilegio: cada usuario, servicio y credencial con solo los permisos que necesita, y cierra al exterior los puertos y paneles de administracion.
+punto_9_descripcion: Los accesos (usuarios, servicios, credenciales, puertos, paneles) estan restringidos al minimo necesario.
+punto_9_referencia: OWASP Top 10 2021 A01
+
+punto_10_id: mass-assignment
+punto_10_severidad: alta
+punto_10_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_10_metodo: juicio
+punto_10_arreglo: No vuelques el cuerpo de la peticion directamente en el modelo: acepta una lista explicita de campos (DTO o lista blanca) y deja fuera los que el usuario no debe tocar (rol, saldo, propietario).
+punto_10_descripcion: Los endpoints no permiten asignar en masa campos que el usuario no debe poder modificar.
+punto_10_referencia: OWASP Top 10 2021 A04
+
+punto_11_id: cookies-seguras
+punto_11_severidad: alta
+punto_11_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend]
+punto_11_metodo: juicio
+punto_11_arreglo: Marca las cookies de sesion con HttpOnly, Secure y SameSite (Lax o Strict) y limita su dominio y ruta.
+punto_11_descripcion: Las cookies de sesion llevan HttpOnly, Secure y SameSite.
+punto_11_referencia: OWASP Top 10 2021 A05
+
+punto_12_id: hash-de-contrasenas
+punto_12_severidad: critica
+punto_12_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_12_metodo: juicio
+punto_12_arreglo: Guarda las contrasenas con argon2id, scrypt o bcrypt (con sal propia y coste adecuado); nunca en claro ni con MD5, SHA-1 o SHA-256 sin mas.
+punto_12_descripcion: Las contrasenas se guardan con un hash lento y con sal, no en claro ni con un hash rapido.
+punto_12_referencia: OWASP Top 10 2021 A02
+
+punto_13_id: rate-limits
+punto_13_severidad: alta
+punto_13_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_13_metodo: juicio
+punto_13_arreglo: Pon un limite de peticiones por IP y por cuenta, mas estricto en login, registro, recuperacion de contrasena y envio de correos.
+punto_13_descripcion: Los endpoints sensibles (login, registro, recuperacion, envios) tienen limite de peticiones.
+punto_13_referencia: OWASP Top 10 2021 A04
+
+punto_14_id: proteccion-de-bots
+punto_14_severidad: media
+punto_14_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend]
+punto_14_metodo: juicio
+punto_14_arreglo: Anade un desafio (captcha o equivalente) en registro, login y formularios publicos, y limita la creacion automatica de cuentas.
+punto_14_descripcion: Los formularios publicos y el registro tienen proteccion contra bots.
+punto_14_referencia: OWASP Top 10 2021 A04
+
+punto_15_id: queries-parametrizadas
+punto_15_severidad: critica
+punto_15_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_15_metodo: juicio
+punto_15_arreglo: Usa consultas parametrizadas o un ORM; nunca concatenes entrada de la persona en una sentencia SQL, un comando o una consulta.
+punto_15_descripcion: Todas las consultas a la base de datos son parametrizadas, sin concatenar entrada externa.
+punto_15_referencia: OWASP Top 10 2021 A03
+
+punto_16_id: validacion-de-inputs
+punto_16_severidad: alta
+punto_16_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend]
+punto_16_metodo: juicio
+punto_16_arreglo: Valida en el servidor tipo, longitud, rango y formato de toda entrada con un esquema (lista blanca) y escapa la salida segun donde se pinte.
+punto_16_descripcion: Toda entrada externa se valida en el servidor con un esquema, y la salida se escapa.
+punto_16_referencia: OWASP Top 10 2021 A03
+
+punto_17_id: fuga-de-contenido
+punto_17_severidad: alta
+punto_17_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend]
+punto_17_metodo: juicio
+punto_17_arreglo: Comprueba en cada recurso que pertenece a quien lo pide (no basta con adivinar un id), no listes directorios y no sirvas ficheros privados desde una carpeta publica.
+punto_17_descripcion: Un usuario no puede leer contenido ajeno ni privado cambiando un id, una ruta o una URL.
+punto_17_referencia: OWASP Top 10 2021 A01
+
+punto_18_id: uploads-seguros
+punto_18_severidad: alta
+punto_18_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_18_metodo: juicio
+punto_18_arreglo: Limita tamano y tipo (por contenido, no por extension), renombra el fichero, guardalo fuera de la raiz web y nunca lo ejecutes ni lo sirvas con el tipo que declara quien lo sube.
+punto_18_descripcion: La subida de ficheros limita tamano y tipo, no usa el nombre original y no permite ejecutarlos.
+punto_18_referencia: OWASP Top 10 2021 A04
+
+punto_19_id: limitar-respuestas-api
+punto_19_severidad: media
+punto_19_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_19_metodo: juicio
+punto_19_arreglo: Pagina las listas con un maximo, devuelve solo los campos necesarios (nunca el registro entero con hashes o campos internos) y limita el tamano de las respuestas.
+punto_19_descripcion: Las respuestas de la API estan paginadas y limitadas, y no exponen campos internos.
+punto_19_referencia: OWASP Top 10 2021 A01
+
+punto_20_id: security-headers
+punto_20_severidad: alta
+punto_20_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend]
+punto_20_metodo: juicio
+punto_20_arreglo: Envia Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy y una politica de frame-ancestors (o X-Frame-Options).
+punto_20_descripcion: Las respuestas web llevan las cabeceras de seguridad habituales.
+punto_20_referencia: OWASP Top 10 2021 A05
+
+punto_21_id: https-obligatorio
+punto_21_severidad: alta
+punto_21_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend, docker]
+punto_21_metodo: juicio
+punto_21_arreglo: Sirve todo por HTTPS con un certificado valido, redirige HTTP a HTTPS y activa HSTS.
+punto_21_descripcion: Todo el trafico va cifrado en transito con HTTPS y HTTP redirige a HTTPS.
+punto_21_referencia: OWASP Top 10 2021 A02
+
+punto_22_id: dependencias-vulnerables
+punto_22_severidad: alta
+punto_22_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_22_metodo: determinista
+punto_22_sonda: dependencias
+punto_22_arreglo: Actualiza la dependencia afectada a la version corregida (npm audit fix, cargo update -p, pip install -U, dotnet add package) o sustituyela. Las que no tienen arreglo se documentan con su motivo.
+punto_22_descripcion: Las dependencias de runtime no tienen vulnerabilidades conocidas de severidad alta o critica, segun la herramienta de auditoria del ecosistema (si esta instalada).
+punto_22_referencia: OWASP Top 10 2021 A06
+
+# --- Medibles que completan el catalogo -------------------------------------
+
+punto_23_id: cors-restringido
+punto_23_severidad: alta
+punto_23_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_23_metodo: juicio
+punto_23_arreglo: Lista los origenes permitidos de forma explicita; nunca "*" con credenciales ni reflejar el origen recibido.
+punto_23_descripcion: La configuracion de CORS solo admite los origenes que deben llamar a la API.
+punto_23_referencia: OWASP Top 10 2021 A05
+
+punto_24_id: proteccion-csrf
+punto_24_severidad: alta
+punto_24_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_24_metodo: juicio
+punto_24_arreglo: Usa tokens anti-CSRF o cookies SameSite en toda peticion que cambie estado y no cambies estado con GET.
+punto_24_descripcion: Las peticiones que cambian estado y usan cookies estan protegidas contra CSRF.
+punto_24_referencia: OWASP Top 10 2021 A01
+
+punto_25_id: debug-y-source-maps
+punto_25_severidad: media
+punto_25_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend]
+punto_25_metodo: juicio
+punto_25_arreglo: Desactiva el modo debug en produccion y no publiques los source maps (o subelos solo al servicio de errores).
+punto_25_descripcion: Produccion no corre en modo debug ni publica source maps.
+punto_25_referencia: OWASP Top 10 2021 A05
+
+punto_26_id: variables-entorno-documentadas
+punto_26_severidad: baja
+punto_26_tipos: [todos]
+punto_26_metodo: juicio
+punto_26_arreglo: Documenta cada variable de entorno en un .env.example (o en el README) con su nombre y para que sirve, sin valores reales.
+punto_26_descripcion: Las variables de entorno que necesita la aplicacion estan documentadas, sin valores.
+punto_26_referencia: OWASP Top 10 2021 A05
+
+punto_27_id: lockfile-versionado
+punto_27_severidad: media
+punto_27_tipos: [node, rust, python, php, ruby, go]
+punto_27_metodo: determinista
+punto_27_sonda: lockfile
+punto_27_arreglo: Genera el lockfile de tu gestor (npm install, cargo generate-lockfile, pip freeze, composer install, bundle install) y versionalo. Una libreria que no lo versiona por convencion puede desactivar el punto con su motivo.
+punto_27_descripcion: El fichero de versiones exactas de las dependencias esta versionado, para que lo que se despliega sea lo que se probo.
+punto_27_referencia: OWASP Top 10 2021 A08
+
+punto_28_id: contenedor-sin-root-ni-secretos
+punto_28_severidad: alta
+punto_28_tipos: [docker]
+punto_28_metodo: juicio
+punto_28_arreglo: Ejecuta el proceso con un usuario sin privilegios y pasa los secretos en tiempo de ejecucion (variables o secretos del orquestador), nunca con COPY, ARG o ENV dentro de la imagen.
+punto_28_descripcion: El contenedor no corre como root y la imagen no lleva secretos dentro.
+punto_28_referencia: OWASP Top 10 2021 A05
+
+punto_29_id: logs-sin-datos-sensibles
+punto_29_severidad: media
+punto_29_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_29_metodo: juicio
+punto_29_arreglo: No registres contrasenas, tokens, cabeceras de autorizacion ni datos personales; enmascaralos antes de escribirlos.
+punto_29_descripcion: Los logs no contienen contrasenas, tokens ni datos personales.
+punto_29_referencia: OWASP Top 10 2021 A09
+
+punto_30_id: errores-sin-traza
+punto_30_severidad: media
+punto_30_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_30_metodo: juicio
+punto_30_arreglo: Devuelve a la persona un mensaje generico con un identificador y guarda la traza solo en el log del servidor.
+punto_30_descripcion: Las paginas y respuestas de error no muestran trazas, rutas internas ni consultas.
+punto_30_referencia: OWASP Top 10 2021 A05
+
+punto_31_id: redirecciones-y-ssrf
+punto_31_severidad: alta
+punto_31_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_31_metodo: juicio
+punto_31_arreglo: Redirige solo a destinos de una lista blanca y, al pedir una URL que da la persona, valida el destino y bloquea direcciones internas y de metadatos de la nube.
+punto_31_descripcion: No hay redirecciones abiertas ni peticiones del servidor a URLs arbitrarias (SSRF).
+punto_31_referencia: OWASP Top 10 2021 A10
+
+punto_32_id: caducidad-de-sesion
+punto_32_severidad: media
+punto_32_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend]
+punto_32_metodo: juicio
+punto_32_arreglo: Da caducidad a sesiones y tokens (corta para el acceso, renovable), invalidalos al cerrar sesion y al cambiar la contrasena.
+punto_32_descripcion: Las sesiones y los tokens caducan y se invalidan al cerrar sesion.
+punto_32_referencia: OWASP Top 10 2021 A07
+
+punto_33_id: backups-y-migraciones
+punto_33_severidad: alta
+punto_33_tipos: [todos]
+punto_33_metodo: juicio
+punto_33_arreglo: Programa copias automaticas de la base de datos, prueba restaurarlas y versiona las migraciones para poder reproducir y deshacer los cambios de esquema.
+punto_33_descripcion: Hay copias de seguridad probadas y migraciones de esquema versionadas.
+punto_33_referencia: OWASP Top 10 2021 A04
+
+punto_34_id: health-check
+punto_34_severidad: baja
+punto_34_tipos: [node, python, java, dotnet, go, php, ruby, rust, docker]
+punto_34_metodo: juicio
+punto_34_arreglo: Expon un endpoint de salud que no revele detalles internos y usalo en el orquestador y en la monitorizacion.
+punto_34_descripcion: El servicio tiene un health check que no revela informacion interna.
+punto_34_referencia: OWASP Top 10 2021 A09
+
+punto_35_id: licencias-de-dependencias
+punto_35_severidad: baja
+punto_35_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_35_metodo: juicio
+punto_35_arreglo: Lista las licencias de las dependencias con la herramienta del ecosistema y sustituye las incompatibles con la licencia de tu producto.
+punto_35_descripcion: Las licencias de las dependencias son compatibles con el uso previsto.
+
+punto_36_id: tests-en-verde
+punto_36_severidad: media
+punto_36_tipos: [todos]
+punto_36_metodo: juicio
+punto_36_arreglo: Ejecuta la suite completa antes de publicar y publica solo un commit con los tests en verde.
+punto_36_descripcion: La suite de tests pasa en el commit que se publica.
+punto_36_referencia: OWASP Top 10 2021 A08
+
+# --- Puntos de dominio (su sonda determinista llega en una tarea posterior) -
+
+punto_37_id: reglas-firebase-abiertas
+punto_37_severidad: critica
+punto_37_tipos: [todos]
+punto_37_metodo: juicio
+punto_37_arreglo: Sustituye reglas como "allow read, write: if true" por reglas que exijan sesion y comprueben el propietario; prueba las reglas con el emulador.
+punto_37_descripcion: Las reglas de Firebase (Firestore, Realtime Database y Storage) no estan abiertas a cualquiera.
+punto_37_referencia: OWASP Top 10 2021 A01
+
+punto_38_id: migraciones-sin-rls
+punto_38_severidad: alta
+punto_38_tipos: [todos]
+punto_38_metodo: juicio
+punto_38_arreglo: Cada migracion que crea una tabla debe activar RLS y crear sus politicas en la misma migracion.
+punto_38_descripcion: Ninguna migracion crea una tabla sin activar la seguridad a nivel de fila.
+punto_38_referencia: OWASP Top 10 2021 A01
+
+punto_39_id: tokens-en-ficheros-de-gestor
+punto_39_severidad: critica
+punto_39_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_39_metodo: juicio
+punto_39_arreglo: Quita el token de .npmrc, .pypirc, settings.xml o equivalentes, usa una variable de entorno (por ejemplo ${NPM_TOKEN}) y rota el token expuesto.
+punto_39_descripcion: Los ficheros de configuracion de los gestores de paquetes (.npmrc, .pypirc, settings.xml) no llevan tokens ni contrasenas.
+punto_39_referencia: OWASP Top 10 2021 A02
+
+punto_40_id: compose-con-contrasenas
+punto_40_severidad: alta
+punto_40_tipos: [docker]
+punto_40_metodo: juicio
+punto_40_arreglo: Saca las contrasenas del docker-compose y leelas de un fichero .env ignorado por git o de secretos de Docker.
+punto_40_descripcion: Los ficheros docker-compose no llevan contrasenas ni tokens escritos.
+punto_40_referencia: OWASP Top 10 2021 A05
+
+punto_41_id: ci-pull-request-target
+punto_41_severidad: alta
+punto_41_tipos: [todos]
+punto_41_metodo: juicio
+punto_41_arreglo: No uses el evento pull_request_target para ejecutar codigo de la rama de un fork; usa pull_request, o separa en dos flujos y no pases secretos al que ejecuta codigo ajeno.
+punto_41_descripcion: Los flujos de CI no ejecutan codigo de forks con permisos de escritura ni secretos (pull_request_target).
+punto_41_referencia: OWASP Top 10 2021 A08
+
+punto_42_id: acciones-ci-sin-sha
+punto_42_severidad: media
+punto_42_tipos: [todos]
+punto_42_metodo: juicio
+punto_42_arreglo: Fija cada accion de terceros a un SHA de commit completo (con la version en un comentario) en lugar de a una etiqueta movil.
+punto_42_descripcion: Las acciones de CI de terceros estan fijadas a un SHA de commit.
+punto_42_referencia: OWASP Top 10 2021 A08
+
+punto_43_id: dockerfile-sin-user
+punto_43_severidad: alta
+punto_43_tipos: [docker]
+punto_43_metodo: juicio
+punto_43_arreglo: Anade una instruccion USER con un usuario sin privilegios al final del Dockerfile y evita ADD de URLs remotas.
+punto_43_descripcion: El Dockerfile declara un USER distinto de root.
+punto_43_referencia: OWASP Top 10 2021 A05
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index bb1ba41..4191568 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -19,6 +19,8 @@ import { runVeredictoCommand, VeredictoCommandError } from './commands/veredicto
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
 import { runSiguienteCommand, SiguienteCommandError } from './commands/siguiente.js';
 import { runDoctorCommand, DoctorCommandError } from './commands/doctor.js';
+import { runDoctorDeployCommand, DoctorDeployCommandError } from './commands/doctor-deploy.js';
+import { DoctorDeployCatalogoError } from './core/doctor-deploy-catalogo.js';
 import { runPausaCommand, PausaCommandError } from './commands/pausa.js';
 import { runRegistrarCosteCommand, RegistrarCosteCommandError } from './commands/registrar-coste.js';
 import {
@@ -82,6 +84,7 @@ Uso:
   taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--push]
   taskctl siguiente TASK-NNN [--json]
   taskctl doctor [--json]
+  taskctl doctor-deploy [--json] [--escribir]
   taskctl pausa TASK-NNN [--push]
   taskctl registrar-coste TASK-NNN --fase <diseno|implementacion|revision> \\
                           (--agente <id>... | --tokens N) [--push]
@@ -93,7 +96,7 @@ Uso:
   taskctl abort-merge
 
 Comandos: new, import, board, metricas, start, plan, approve, review, codex-review, veredicto,
-finish, siguiente, doctor, pausa, registrar-coste, cadena.
+finish, siguiente, doctor, doctor-deploy, pausa, registrar-coste, cadena.
 metricas saca, por tarea, cuanto duro cada fase (diseno, curso, revision) y
 cuantas rondas de revision hubo, con sus hallazgos CRITICO/IMPORTANTE/MENOR y su
 origen (cada uno una vez por tarea: revisor + ID; un informe sin tabla es sin dato,
@@ -126,6 +129,14 @@ ramas develop y main/master, origin, workspace, .taskcode/config.yml, coherencia
 config pide merge request o declara plataforma, gh/glab y su sesion). Una linea por comprobacion
 (ok, aviso, error u omitida) y, en cada aviso o error, el comando que lo arregla; sale con 1 si hay
 algun error. Solo lee. --json da lo mismo en una linea de JSON.
+doctor-deploy comprueba, antes de publicar, que la aplicacion no deja agujeros conocidos: detecta el tipo (Node,
+Rust, Python, Java, .NET, Go, PHP, Ruby, Docker, frontend) y recorre un catalogo de puntos. Cada punto sale OK
+(con evidencia), FALLA (con evidencia y arreglo), NO VERIFICADO (con lo que falta) o NO APLICA (con el motivo).
+Los puntos de juicio salen NO VERIFICADO; las comprobaciones deterministas son secretos en el arbol y en el
+historial, ficheros de secretos versionados, .gitignore, lockfile y la auditoria de dependencias si la
+herramienta esta instalada. Sale con 1 si algun punto FALLA (NO VERIFICADO no cambia el codigo, pero el resumen
+lo cuenta). El valor de un secreto nunca se muestra. --json da una linea de JSON; --escribir guarda el informe
+en docs/doctor-deploy/<fecha>.md (sin commitear). Un proyecto ajusta el catalogo en .taskcode/doctor-deploy.yml.
 siguiente dice que fase toca y si preguntar segun modo_flujo (.taskcode/config.yml:
 manual, semiautomatico o automatico); solo lee. pausa registra que la persona
 no quiere pasar todavia a la siguiente fase. cadena bloquea el arbol mientras
@@ -711,6 +722,24 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     }
   }
 
+  if (cmd === 'doctor-deploy') {
+    try {
+      const r = runDoctorDeployCommand(argv.slice(1), { repoCwd: process.cwd() });
+      process.stdout.write(r.salida);
+      if (r.mensajeEscritura !== '') {
+        // Con --json, stdout es SOLO el JSON: el aviso va a stderr.
+        (r.json ? process.stderr : process.stdout).write(r.mensajeEscritura);
+      }
+      return r.codigo;
+    } catch (e) {
+      if (e instanceof DoctorDeployCommandError || e instanceof DoctorDeployCatalogoError) {
+        printCliError(e);
+        return 1;
+      }
+      throw e;
+    }
+  }
+
   if (cmd === 'siguiente') {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
new file mode 100644
index 0000000..f9633ee
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
@@ -0,0 +1,296 @@
+/**
+ * `taskctl doctor-deploy [--json] [--escribir]` - TASK-066.
+ *
+ * Recorre el catalogo de puntos de `scripts/doctor-deploy.yml` (mas la capa de
+ * `.taskcode/doctor-deploy.yml`), detecta el tipo de aplicacion por ficheros
+ * marcadores y dice, punto por punto, si esta bien (OK), mal (FALLA), no se
+ * pudo comprobar (NO VERIFICADO, con lo que falta) o no corresponde (NO
+ * APLICA, con el motivo). Es un comando distinto de `doctor`: aquel comprueba
+ * que el proyecto esta listo para trabajar con el flujo de tareas; este, que la
+ * aplicacion esta lista para publicarse.
+ *
+ * Decisiones:
+ * - Solo lee. Con `--escribir` guarda el informe en docs/doctor-deploy/ pero
+ *   NO lo commitea (como `metricas --escribir`).
+ * - Las unicas comprobaciones deterministas son las de fs/sondas-deploy.ts; el
+ *   resto del catalogo es de juicio y sale NO VERIFICADO.
+ * - Una sonda que lanza una excepcion es NO VERIFICADO de ESE punto, nunca un
+ *   throw hacia el CLI ni un OK.
+ * - Codigo de salida: 0 sin FALLA, 1 con alguna. NO VERIFICADO no lo cambia,
+ *   pero el resumen dice cuantos puntos quedaron sin verificar.
+ * - Todo texto que sale (stdout, JSON, informe en disco) pasa por
+ *   `ocultarSecretos`: es la segunda red tras el enmascarado en origen.
+ */
+import { existsSync, linkSync, mkdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
+import path from 'node:path';
+import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import {
+  cargarCapaProyecto,
+  cargarCatalogoDeploy,
+  combinarCatalogo,
+  TIPO_TODOS,
+  type CatalogoEfectivo,
+  type PuntoCatalogo,
+} from '../core/doctor-deploy-catalogo.js';
+import {
+  codigoSalida,
+  formatearInforme,
+  formatearJson,
+  formatearTexto,
+  sanearPunto,
+  type InformeDeploy,
+  type ResultadoPunto,
+} from '../core/doctor-deploy.js';
+import { ocultarSecretos } from '../core/secretos.js';
+import { ocultarCredenciales } from '../core/plataforma-remota.js';
+import { detectarTipos, listarArchivos } from '../fs/deteccion-app.js';
+import { gitTexto } from '../fs/git-crudo.js';
+import { pathDelProceso } from '../fs/herramientas-deploy.js';
+import {
+  OPCIONES_SONDAS_POR_DEFECTO,
+  SONDAS,
+  type ContextoDeploy,
+  type OpcionesSondas,
+} from '../fs/sondas-deploy.js';
+
+export class DoctorDeployCommandError extends Error {
+  constructor(message: string) {
+    super(message);
+    this.name = 'DoctorDeployCommandError';
+  }
+}
+
+/** Flags de `taskctl doctor-deploy`. */
+export const FLAGS_DOCTOR_DEPLOY: readonly string[] = ['--json', '--escribir'];
+
+/** Carpeta (relativa a la raiz del repo) donde `--escribir` deja el informe. */
+export const CARPETA_INFORMES = path.join('docs', 'doctor-deploy');
+
+export interface DoctorDeployDeps {
+  repoCwd: string;
+  /** Ruta del catalogo del plugin (por defecto el del plugin). Para los tests. */
+  rutaCatalogo?: string;
+  /** Reloj inyectable (fecha del informe). Para los tests. */
+  ahora?: () => Date;
+  /** Limites y PATH de las sondas. Para los tests. */
+  opciones?: Partial<OpcionesSondas>;
+}
+
+export interface DoctorDeployResult {
+  informe: InformeDeploy;
+  /** 0 sin FALLA, 1 con alguna. */
+  codigo: 0 | 1;
+  /** Lo que hay que escribir en stdout: el texto, o SOLO el JSON con --json. */
+  salida: string;
+  json: boolean;
+  /** Ruta del informe escrito con --escribir; null si no se pidio. */
+  rutaInforme: string | null;
+  /** Aviso de que se escribio el informe (a stdout en texto, a stderr con --json); '' si no. */
+  mensajeEscritura: string;
+}
+
+const salidaSegura = (t: string): string => ocultarSecretos(ocultarCredenciales(t));
+
+// ---------------------------------------------------------------------
+
+function evaluarPunto(punto: PuntoCatalogo, ctx: ContextoDeploy, cat: CatalogoEfectivo): ResultadoPunto {
+  const base = {
+    id: punto.id,
+    severidad: punto.severidad,
+    metodo: punto.metodo,
+    arreglo: punto.arreglo,
+    descripcion: punto.descripcion,
+    referencia: punto.referencia,
+    desactivado: false,
+  };
+
+  const desactivacion = cat.desactivados.get(punto.id);
+  if (desactivacion !== undefined) {
+    return {
+      ...base,
+      desactivado: true,
+      estado: 'no-aplica',
+      motivo: `desactivado por el proyecto: ${desactivacion}`,
+      evidencias: [{ descripcion: `desactivado en .taskcode/doctor-deploy.yml con el motivo: ${desactivacion}` }],
+    };
+  }
+
+  if (!punto.tipos.includes(TIPO_TODOS)) {
+    const detectados = new Set(ctx.tipos.map((t) => t.id));
+    if (!punto.tipos.some((t) => detectados.has(t))) {
+      return {
+        ...base,
+        estado: 'no-aplica',
+        motivo:
+          `solo aplica a ${punto.tipos.join(' o ')}; ` +
+          `detectado: ${ctx.tipos.length === 0 ? 'ningun tipo' : ctx.tipos.map((t) => t.id).join(', ')}`,
+        evidencias: [],
+      };
+    }
+  }
+
+  if (punto.metodo === 'juicio' || punto.sonda === null) {
+    return {
+      ...base,
+      estado: 'no-verificado',
+      motivo: `falta la revision con juicio (leer el codigo con criterio): ${punto.descripcion}`,
+      evidencias: [],
+    };
+  }
+
+  const sonda = SONDAS[punto.sonda];
+  if (sonda === undefined) {
+    return { ...base, estado: 'no-verificado', motivo: `la comprobacion "${punto.sonda}" no esta registrada en este taskctl`, evidencias: [] };
+  }
+  try {
+    return sanearPunto({ ...base, ...sonda(ctx) });
+  } catch (e: unknown) {
+    const msg = (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim();
+    return {
+      ...base,
+      estado: 'no-verificado',
+      motivo: `la comprobacion fallo por una excepcion y no se pudo verificar: ${msg}`,
+      evidencias: [],
+    };
+  }
+}
+
+function fechaLocal(d: Date): string {
+  const dos = (n: number): string => String(n).padStart(2, '0');
+  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
+}
+
+/**
+ * Escribe el informe en docs/doctor-deploy/<fecha>.md; si ya existe uno de ese
+ * dia, <fecha>-2.md, <fecha>-3.md... Escritura atomica: fichero temporal en la
+ * misma carpeta y `link` (falla si el destino existe, no pisa nada) o, donde
+ * el sistema de ficheros no lo admite, `rename`.
+ */
+export function escribirInforme(raiz: string, fecha: string, contenido: string): string {
+  const dir = path.join(raiz, CARPETA_INFORMES);
+  mkdirSync(dir, { recursive: true });
+  const tmp = path.join(dir, `.informe-${process.pid}-${Date.now()}.tmp`);
+  writeFileSync(tmp, contenido, { encoding: 'utf8', flag: 'wx' });
+  try {
+    for (let n = 1; n < 1000; n++) {
+      const destino = path.join(dir, n === 1 ? `${fecha}.md` : `${fecha}-${n}.md`);
+      try {
+        linkSync(tmp, destino);
+        return destino;
+      } catch (e: unknown) {
+        const code = (e as NodeJS.ErrnoException).code;
+        if (code === 'EEXIST') continue;
+        // Sin soporte de enlaces duros: rename, tras comprobar a mano que no existe.
+        if (existsSync(destino)) continue;
+        renameSync(tmp, destino);
+        return destino;
+      }
+    }
+    throw new DoctorDeployCommandError(`[ERROR] taskctl doctor-deploy: ya hay mil informes de ${fecha} en ${CARPETA_INFORMES}. Muevelos o borralos.`);
+  } finally {
+    try {
+      unlinkSync(tmp);
+    } catch {
+      // ya renombrado, o no existe
+    }
+  }
+}
+
+// ---------------------------------------------------------------------
+
+export function runDoctorDeployCommand(argv: readonly string[], deps: DoctorDeployDeps): DoctorDeployResult {
+  rechazarFlagsDesconocidos(argv, FLAGS_DOCTOR_DEPLOY, 'doctor-deploy', (m) => new DoctorDeployCommandError(m));
+  const sobra = argv.find((a) => !a.startsWith('-'));
+  if (sobra !== undefined) {
+    throw new DoctorDeployCommandError(
+      `[ERROR] taskctl doctor-deploy: no admite argumentos ("${sobra}"). Uso: taskctl doctor-deploy [--json] [--escribir].`
+    );
+  }
+  const json = argv.includes('--json');
+  const escribir = argv.includes('--escribir');
+
+  const raizGit = gitTexto(['rev-parse', '--show-toplevel'], deps.repoCwd, { timeoutMs: 15_000 });
+  if (raizGit === null || raizGit.trim() === '') {
+    throw new DoctorDeployCommandError(
+      '[ERROR] taskctl doctor-deploy: este directorio no es un repositorio Git (o git no esta instalado).\n' +
+        '        Ejecutalo desde la raiz del proyecto que quieres comprobar.'
+    );
+  }
+  const raiz = path.normalize(raizGit.trim());
+
+  const base = cargarCatalogoDeploy(deps.rutaCatalogo);
+  const capa = cargarCapaProyecto(raiz, base);
+  const catalogo = combinarCatalogo(base, capa);
+
+  const archivos = listarArchivos(raiz);
+  if (archivos === null) {
+    throw new DoctorDeployCommandError('[ERROR] taskctl doctor-deploy: no se pudo listar los ficheros del proyecto (git ls-files fallo).');
+  }
+  const tipos = detectarTipos(archivos.presentes, catalogo.tipos);
+
+  const ctx: ContextoDeploy = {
+    cwd: raiz,
+    presentes: archivos.presentes,
+    versionados: archivos.versionados,
+    tipos,
+    silencios: catalogo.silencios,
+    silenciosUsados: new Set<number>(),
+    opciones: {
+      ...OPCIONES_SONDAS_POR_DEFECTO,
+      pathHerramientas: pathDelProceso(),
+      ...deps.opciones,
+    },
+  };
+
+  const puntos = catalogo.puntos.map((p) => evaluarPunto(p, ctx, catalogo));
+
+  const avisos = [...catalogo.avisos];
+  if (tipos.length === 0) {
+    avisos.push(
+      'No se detecto ningun tipo de aplicacion (no hay package.json, Cargo.toml, pyproject.toml, pom.xml...): ' +
+        'los puntos que dependen de un tipo salen NO APLICA. Si el proyecto tiene otra estructura, comprueba que lo ejecutas desde su raiz.'
+    );
+  }
+  for (const s of catalogo.silencios) {
+    if (!ctx.silenciosUsados.has(s.numero)) {
+      avisos.push(
+        `silenciar_${s.numero} (patron ${s.patron}, fichero ${s.fichero}) no coincide con ningun hallazgo: ` +
+          'ya no hace falta, o el patron o la ruta no son los que informa el punto.'
+      );
+    }
+  }
+
+  const estado = gitTexto(['status', '--porcelain'], raiz, { timeoutMs: 30_000 });
+  const commit = gitTexto(['rev-parse', '--verify', '--quiet', 'HEAD'], raiz, { timeoutMs: 15_000 });
+  const rama = gitTexto(['symbolic-ref', '--short', '-q', 'HEAD'], raiz, { timeoutMs: 15_000 });
+  if (estado === null) avisos.push('no se pudo saber si el arbol esta limpio (git status fallo): se marca como sucio.');
+
+  const ahora = (deps.ahora ?? ((): Date => new Date()))();
+  const informe: InformeDeploy = {
+    version: 1,
+    comando: 'doctor-deploy',
+    fecha: ahora.toISOString(),
+    commit: commit === null || commit.trim() === '' ? null : commit.trim(),
+    rama: rama === null || rama.trim() === '' ? null : rama.trim(),
+    arbolSucio: estado === null ? true : estado.trim() !== '',
+    tipos,
+    avisos,
+    puntos,
+  };
+
+  const salida = salidaSegura(json ? formatearJson(informe) : formatearTexto(informe));
+  const codigo = codigoSalida(puntos);
+
+  let rutaInforme: string | null = null;
+  let mensajeEscritura = '';
+  if (escribir) {
+    const destino = escribirInforme(raiz, fechaLocal(ahora), salidaSegura(formatearInforme(informe)));
+    rutaInforme = destino;
+    const rel = path.relative(raiz, destino).replace(/\\/g, '/');
+    mensajeEscritura =
+      `Informe escrito en ${rel}${informe.arbolSucio ? ' (el arbol estaba sucio: no describe un commit limpio)' : ''}. ` +
+      'No se ha commiteado: revisalo y commitealo tu.\n';
+  }
+
+  return { informe, codigo, salida, json, rutaInforme, mensajeEscritura };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-auditoria.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-auditoria.ts
new file mode 100644
index 0000000..b5101f6
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-auditoria.ts
@@ -0,0 +1,234 @@
+/**
+ * Interpretacion de la salida de las herramientas de auditoria de dependencias
+ * que `taskctl doctor-deploy` usa si estan instaladas (TASK-066). Funciones
+ * puras: reciben lo que la herramienta imprimio y devuelven un veredicto. El
+ * lanzamiento del proceso esta en fs/herramientas-deploy.ts.
+ *
+ * Politica (decision de la persona, D4):
+ * - Solo dependencias de runtime, donde la herramienta lo permite.
+ * - FALLA desde severidad alta o critica; el resto se lista sin fallar.
+ * - Una herramienta que no publica severidad (cargo audit, pip-audit,
+ *   govulncheck) no da base para decir «es baja»: se trata como alta.
+ * - Cualquier salida que no se entienda es NO VERIFICADO, nunca OK.
+ *
+ * AVISO: estos interpretes se escribieron contra el formato documentado de cada
+ * herramienta y se prueban con muestras de ese formato, no contra la
+ * herramienta real (que necesita red). Si una version nueva cambia el formato,
+ * el resultado es `no-verificado`, no un OK falso.
+ */
+
+export interface VeredictoAuditoria {
+  estado: 'ok' | 'falla' | 'no-verificado';
+  /** Una frase con los numeros o el motivo. */
+  resumen: string;
+  /** Paquetes con vulnerabilidad alta o critica (o sin severidad publicada). */
+  graves: string[];
+  /** El resto, listado sin fallar. */
+  otras: string[];
+}
+
+const MAX_NOMBRES = 15;
+
+function recortar(t: string, max = 160): string {
+  const u = t.replace(/\s+/g, ' ').trim();
+  return u.length > max ? `${u.slice(0, max)}...` : u;
+}
+
+function ilegible(herramienta: string, detalle: string): VeredictoAuditoria {
+  return {
+    estado: 'no-verificado',
+    resumen: `la salida de ${herramienta} no se pudo interpretar (${detalle})`,
+    graves: [],
+    otras: [],
+  };
+}
+
+function limpio(resumen: string): VeredictoAuditoria {
+  return { estado: 'ok', resumen, graves: [], otras: [] };
+}
+
+function conVulnerabilidades(resumen: string, graves: string[], otras: string[]): VeredictoAuditoria {
+  const unicos = (xs: string[]): string[] => [...new Set(xs)].slice(0, MAX_NOMBRES);
+  return { estado: graves.length > 0 ? 'falla' : 'ok', resumen, graves: unicos(graves), otras: unicos(otras) };
+}
+
+function esObjeto(x: unknown): x is Record<string, unknown> {
+  return typeof x === 'object' && x !== null && !Array.isArray(x);
+}
+
+function num(x: unknown): number | null {
+  return typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null;
+}
+
+/** `npm audit --json` y `pnpm audit --json` (mismo formato de metadata). */
+export function interpretarNpmAudit(herramienta: 'npm' | 'pnpm', stdout: string, status: number | null): VeredictoAuditoria {
+  let o: unknown;
+  try {
+    o = JSON.parse(stdout);
+  } catch {
+    return ilegible(herramienta, 'no es JSON');
+  }
+  if (!esObjeto(o)) return ilegible(herramienta, 'no es un objeto JSON');
+  if (o['error'] !== undefined) {
+    const e = o['error'];
+    const detalle = esObjeto(e) ? `${String(e['code'] ?? '')} ${String(e['summary'] ?? e['message'] ?? '')}` : String(e);
+    return {
+      estado: 'no-verificado',
+      resumen: `${herramienta} audit devolvio un error: ${recortar(detalle)}`,
+      graves: [],
+      otras: [],
+    };
+  }
+  const meta = esObjeto(o['metadata']) ? o['metadata'] : null;
+  const v = meta !== null && esObjeto(meta['vulnerabilities']) ? meta['vulnerabilities'] : null;
+  if (v === null) return ilegible(herramienta, 'falta metadata.vulnerabilities');
+  const critical = num(v['critical']);
+  const high = num(v['high']);
+  const moderate = num(v['moderate']);
+  const low = num(v['low']);
+  if (critical === null || high === null || moderate === null || low === null) {
+    return ilegible(herramienta, 'conteos de vulnerabilidades no numericos');
+  }
+  const info = num(v['info']) ?? 0;
+  const total = critical + high + moderate + low + info;
+  if (status !== 0 && status !== 1) return ilegible(herramienta, `codigo de salida ${String(status)}`);
+  if (status === 1 && total === 0) return ilegible(herramienta, 'codigo de salida 1 sin vulnerabilidades en el informe');
+
+  const graves: string[] = [];
+  const otras: string[] = [];
+  const fuente = esObjeto(o['advisories']) ? Object.values(o['advisories']) : esObjeto(o['vulnerabilities']) ? Object.entries(o['vulnerabilities']).map(([nombre, x]) => (esObjeto(x) ? { module_name: nombre, ...x } : x)) : [];
+  for (const x of fuente) {
+    if (!esObjeto(x)) continue;
+    const nombre = String(x['module_name'] ?? x['name'] ?? '?');
+    const sev = String(x['severity'] ?? '');
+    (sev === 'high' || sev === 'critical' ? graves : otras).push(`${nombre} (${sev})`);
+  }
+  const resumen = `${critical} criticas, ${high} altas, ${moderate} moderadas, ${low} bajas${info > 0 ? `, ${info} informativas` : ''}`;
+  if (total === 0) return limpio(resumen);
+  // Si los conteos dicen que hay graves pero no se pudo nombrar ninguna, el conteo manda.
+  if (critical + high > 0 && graves.length === 0) graves.push('(ver la salida de la herramienta)');
+  return conVulnerabilidades(resumen, graves, otras);
+}
+
+/** `yarn audit --json` de Yarn clasico (una linea JSON por evento). */
+export function interpretarYarnAudit(stdout: string): VeredictoAuditoria {
+  let resumen: Record<string, unknown> | null = null;
+  const graves: string[] = [];
+  const otras: string[] = [];
+  for (const linea of stdout.split(/\r?\n/)) {
+    if (linea.trim() === '') continue;
+    let o: unknown;
+    try {
+      o = JSON.parse(linea);
+    } catch {
+      return ilegible('yarn', 'una linea no es JSON');
+    }
+    if (!esObjeto(o)) continue;
+    if (o['type'] === 'auditSummary' && esObjeto(o['data']) && esObjeto(o['data']['vulnerabilities'])) {
+      resumen = o['data']['vulnerabilities'];
+    } else if (o['type'] === 'auditAdvisory' && esObjeto(o['data']) && esObjeto(o['data']['advisory'])) {
+      const a = o['data']['advisory'];
+      const sev = String(a['severity'] ?? '');
+      (sev === 'high' || sev === 'critical' ? graves : otras).push(`${String(a['module_name'] ?? '?')} (${sev})`);
+    }
+  }
+  if (resumen === null) return ilegible('yarn', 'falta el resumen auditSummary');
+  const c = num(resumen['critical']);
+  const h = num(resumen['high']);
+  const m = num(resumen['moderate']);
+  const l = num(resumen['low']);
+  if (c === null || h === null || m === null || l === null) return ilegible('yarn', 'conteos no numericos');
+  const texto = `${c} criticas, ${h} altas, ${m} moderadas, ${l} bajas`;
+  if (c + h + m + l === 0) return limpio(texto);
+  if (c + h > 0 && graves.length === 0) graves.push('(ver la salida de la herramienta)');
+  return conVulnerabilidades(texto, graves, otras);
+}
+
+/** `cargo audit --json`. */
+export function interpretarCargoAudit(stdout: string, status: number | null): VeredictoAuditoria {
+  let o: unknown;
+  try {
+    o = JSON.parse(stdout);
+  } catch {
+    return ilegible('cargo audit', 'no es JSON');
+  }
+  if (!esObjeto(o) || !esObjeto(o['vulnerabilities'])) return ilegible('cargo audit', 'falta "vulnerabilities"');
+  const v = o['vulnerabilities'];
+  if (typeof v['found'] !== 'boolean' || !Array.isArray(v['list'])) return ilegible('cargo audit', 'campos "found"/"list" ausentes');
+  if (status !== 0 && status !== 1) return ilegible('cargo audit', `codigo de salida ${String(status)}`);
+  if (!v['found']) {
+    if (status === 1) return ilegible('cargo audit', 'codigo 1 sin vulnerabilidades en el informe');
+    return limpio('0 vulnerabilidades en Cargo.lock');
+  }
+  const graves = (v['list'] as unknown[]).map((x) => {
+    const a = esObjeto(x) && esObjeto(x['advisory']) ? x['advisory'] : {};
+    const p = esObjeto(x) && esObjeto(x['package']) ? x['package'] : {};
+    return `${String(p['name'] ?? a['package'] ?? '?')} (${String(a['id'] ?? '?')})`;
+  });
+  return conVulnerabilidades(
+    `${graves.length} vulnerabilidades (cargo audit no publica severidad: se tratan como altas)`,
+    graves.length > 0 ? graves : ['(ver la salida de la herramienta)'],
+    []
+  );
+}
+
+/** `pip-audit -f json`. */
+export function interpretarPipAudit(stdout: string, status: number | null): VeredictoAuditoria {
+  let o: unknown;
+  try {
+    o = JSON.parse(stdout);
+  } catch {
+    return ilegible('pip-audit', 'no es JSON');
+  }
+  const deps: unknown = Array.isArray(o) ? o : esObjeto(o) ? o['dependencies'] : undefined;
+  if (!Array.isArray(deps)) return ilegible('pip-audit', 'falta "dependencies"');
+  if (status !== 0 && status !== 1) return ilegible('pip-audit', `codigo de salida ${String(status)}`);
+  const graves: string[] = [];
+  for (const d of deps) {
+    if (!esObjeto(d) || !Array.isArray(d['vulns']) || d['vulns'].length === 0) continue;
+    const ids = (d['vulns'] as unknown[]).map((v) => (esObjeto(v) ? String(v['id'] ?? '?') : '?')).join(', ');
+    graves.push(`${String(d['name'] ?? '?')} ${String(d['version'] ?? '')} (${ids})`.replace(/\s+\(/, ' ('));
+  }
+  if (graves.length === 0) {
+    if (status === 1) return ilegible('pip-audit', 'codigo 1 sin vulnerabilidades en el informe');
+    return limpio(`${deps.length} dependencias auditadas, 0 con vulnerabilidades`);
+  }
+  return conVulnerabilidades(
+    `${graves.length} paquetes con vulnerabilidades (pip-audit no publica severidad: se tratan como altas)`,
+    graves,
+    []
+  );
+}
+
+/** `dotnet list package --vulnerable --include-transitive` (texto, en ingles). */
+export function interpretarDotnetVulnerable(stdout: string, status: number | null): VeredictoAuditoria {
+  if (status !== 0) return ilegible('dotnet', `codigo de salida ${String(status)}`);
+  const graves: string[] = [];
+  const otras: string[] = [];
+  for (const linea of stdout.split(/\r?\n/)) {
+    const m = /^\s*>\s+(\S+)\s+.*?\b(Low|Moderate|High|Critical)\b/.exec(linea);
+    if (m === null) continue;
+    const sev = m[2] as string;
+    (sev === 'High' || sev === 'Critical' ? graves : otras).push(`${m[1] as string} (${sev})`);
+  }
+  if (graves.length + otras.length > 0) {
+    return conVulnerabilidades(`${graves.length} graves, ${otras.length} de severidad baja o moderada`, graves, otras);
+  }
+  if (/has no vulnerable packages|no vulnerable packages/i.test(stdout)) return limpio('0 paquetes vulnerables (incluye transitivos)');
+  return ilegible('dotnet', 'ni lista de paquetes vulnerables ni confirmacion de que no hay');
+}
+
+/** `govulncheck ./...` (texto). */
+export function interpretarGovulncheck(stdout: string, status: number | null): VeredictoAuditoria {
+  const ids = [...stdout.matchAll(/Vulnerability #\d+:\s*(GO-\d+-\d+)/g)].map((m) => m[1] as string);
+  if (ids.length > 0) {
+    if (status !== 3) return ilegible('govulncheck', `lista vulnerabilidades pero sale con ${String(status)}`);
+    return conVulnerabilidades(
+      `${ids.length} vulnerabilidades alcanzables (govulncheck no publica severidad: se tratan como altas)`,
+      ids,
+      []
+    );
+  }
+  if (status === 0 && /No vulnerabilities found/i.test(stdout)) return limpio('0 vulnerabilidades alcanzables');
+  return ilegible('govulncheck', `codigo de salida ${String(status)} sin confirmacion de que no hay vulnerabilidades`);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
new file mode 100644
index 0000000..fc5a5f0
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
@@ -0,0 +1,521 @@
+/**
+ * Catalogo de `taskctl doctor-deploy` (TASK-066): lectura y validacion de
+ * `scripts/doctor-deploy.yml` (el que trae el plugin) y de la capa del proyecto
+ * `.taskcode/doctor-deploy.yml`.
+ *
+ * Mismo criterio que `heuristica.ts` y `catalogo-skills.ts`: un unico parser
+ * (`parseBloqueClaveValor`), formato plano con prefijo `tipo_N_` / `punto_N_`,
+ * fallo en cerrado. El catalogo del plugin lo distribuye el plugin: si falta o
+ * esta roto, la instalacion esta rota y se aborta.
+ *
+ * Capa del proyecto (`.taskcode/doctor-deploy.yml`, opcional):
+ * - `desactivar_N_id` + `desactivar_N_motivo`: desactiva un punto. Sin motivo
+ *   aborta (es una aceptacion de riesgo). Un id que no existe AVISA y se
+ *   ignora (politica de `config.yml`).
+ * - `punto_N_*`: anade un punto propio. Solo puede ser de `juicio` o usar una
+ *   sonda ya registrada (el proyecto no inyecta codigo). Un id repetido (con
+ *   el catalogo o consigo mismo) aborta: no se pisa un punto del plugin.
+ * - `silenciar_N_*`: silencia UN hallazgo concreto (patron + fichero, y
+ *   opcionalmente commit) con motivo, quien y fecha. Es la valvula para un
+ *   secreto ya rotado o un falso positivo, distinta de desactivar el punto.
+ * - Una clave desconocida avisa y se ignora.
+ */
+import { readFileSync } from 'node:fs';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { parseBloqueClaveValor, type ParClaveValor } from './frontmatter.js';
+
+export class DoctorDeployCatalogoError extends Error {
+  constructor(message: string) {
+    super(message);
+    this.name = 'DoctorDeployCatalogoError';
+  }
+}
+
+export const SEVERIDADES = ['critica', 'alta', 'media', 'baja'] as const;
+export type Severidad = (typeof SEVERIDADES)[number];
+export const METODOS = ['determinista', 'juicio'] as const;
+export type Metodo = (typeof METODOS)[number];
+
+/** Comprobaciones deterministas que existen en el codigo (`fs/sondas-deploy.ts`). */
+export const SONDAS_REGISTRADAS: readonly string[] = [
+  'secretos-arbol',
+  'secretos-historial',
+  'ficheros-secretos',
+  'gitignore-env',
+  'lockfile',
+  'dependencias',
+];
+
+/** Valor de `tipos` que significa «aplica siempre». */
+export const TIPO_TODOS = 'todos';
+
+export interface TipoApp {
+  id: string;
+  nombre: string;
+  marcadores: string[];
+}
+
+export interface PuntoCatalogo {
+  id: string;
+  severidad: Severidad;
+  /** Ids de tipo, o `['todos']`. */
+  tipos: string[];
+  metodo: Metodo;
+  /** Solo en los deterministas. */
+  sonda: string | null;
+  arreglo: string;
+  descripcion: string;
+  referencia: string | null;
+  origen: 'plugin' | 'proyecto';
+}
+
+export interface CatalogoBase {
+  tipos: TipoApp[];
+  puntos: PuntoCatalogo[];
+}
+
+export interface Silencio {
+  /** Posicion en el fichero del proyecto (1-based). */
+  numero: number;
+  patron: string;
+  fichero: string;
+  /** Prefijo (7+ caracteres) o hash del commit; null = cualquiera. */
+  commit: string | null;
+  motivo: string;
+  quien: string;
+  fecha: string;
+}
+
+export interface CapaProyecto {
+  desactivados: Array<{ id: string; motivo: string }>;
+  anadidos: PuntoCatalogo[];
+  silencios: Silencio[];
+  avisos: string[];
+}
+
+export interface CatalogoEfectivo {
+  tipos: TipoApp[];
+  /** Los del plugin, en su orden, y detras los anadidos por el proyecto. */
+  puntos: PuntoCatalogo[];
+  /** id -> motivo de la desactivacion. */
+  desactivados: Map<string, string>;
+  silencios: Silencio[];
+  avisos: string[];
+}
+
+export const FICHERO_CATALOGO_DEPLOY = 'doctor-deploy.yml';
+/** Ruta de la capa del proyecto, relativa a su raiz. */
+export const RUTA_CAPA_PROYECTO = path.join('.taskcode', 'doctor-deploy.yml');
+
+const MAX_ENTRADAS = 500;
+const CAMPOS_TIPO = ['id', 'nombre', 'marcadores'] as const;
+const CAMPOS_PUNTO = ['id', 'severidad', 'tipos', 'metodo', 'sonda', 'arreglo', 'descripcion', 'referencia'] as const;
+const CAMPOS_DESACTIVAR = ['id', 'motivo'] as const;
+const CAMPOS_SILENCIAR = ['patron', 'fichero', 'commit', 'motivo', 'quien', 'fecha'] as const;
+
+type Valor = { valor: unknown; numeroLinea: number };
+type Bloque = Map<string, Valor>;
+
+function packageRoot(): string {
+  // dist/src/core/doctor-deploy-catalogo.js -> core -> src -> dist -> raiz del plugin
+  return path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
+}
+
+/** Ruta del catalogo del plugin. Respeta CLAUDE_PLUGIN_ROOT, como las demas. */
+export function resolverRutaCatalogoDeploy(): string {
+  const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
+  if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
+    return path.join(pluginRoot, 'scripts', FICHERO_CATALOGO_DEPLOY);
+  }
+  return path.join(packageRoot(), 'scripts', FICHERO_CATALOGO_DEPLOY);
+}
+
+// ---------------------------------------------------------------------
+// Lectura generica de bloques planos `prefijo_N_campo`
+// ---------------------------------------------------------------------
+
+interface Familia {
+  prefijo: string;
+  campos: readonly string[];
+}
+
+interface Agrupado {
+  /** familia -> N -> campo -> valor */
+  bloques: Map<string, Map<number, Bloque>>;
+  /** Claves que no son de ninguna familia (ni `extras`). */
+  desconocidas: ParClaveValor[];
+  extras: Map<string, ParClaveValor>;
+}
+
+function agrupar(
+  pares: readonly ParClaveValor[],
+  familias: readonly Familia[],
+  extras: readonly string[],
+  ruta: string,
+  fallar: (m: string) => Error
+): Agrupado {
+  const bloques = new Map<string, Map<number, Bloque>>();
+  for (const f of familias) bloques.set(f.prefijo, new Map());
+  const desconocidas: ParClaveValor[] = [];
+  const extrasLeidos = new Map<string, ParClaveValor>();
+  const vistas = new Set<string>();
+
+  for (const par of pares) {
+    const donde = `${ruta}:${par.numeroLinea}`;
+    if (vistas.has(par.clave)) {
+      throw fallar(`[ERROR] ${donde}: la clave "${par.clave}" esta repetida. Deja una sola.`);
+    }
+    vistas.add(par.clave);
+    if (extras.includes(par.clave)) {
+      extrasLeidos.set(par.clave, par);
+      continue;
+    }
+    const m = /^([a-z]+)_(\d+)_([a-z_]+)$/.exec(par.clave);
+    const fam = m === null ? undefined : familias.find((f) => f.prefijo === m[1]);
+    if (m === null || fam === undefined || !fam.campos.includes(m[3] as string)) {
+      desconocidas.push(par);
+      continue;
+    }
+    const n = Number(m[2]);
+    if (!Number.isSafeInteger(n) || n < 1 || n > MAX_ENTRADAS) {
+      throw fallar(
+        `[ERROR] ${donde}: "${par.clave}" tiene un numero fuera de rango (1 a ${MAX_ENTRADAS}). ` +
+          'Numera las entradas desde 1, sin saltos.'
+      );
+    }
+    const delFamilia = bloques.get(fam.prefijo) as Map<number, Bloque>;
+    const bloque = delFamilia.get(n) ?? new Map<string, Valor>();
+    bloque.set(m[3] as string, { valor: par.valor, numeroLinea: par.numeroLinea });
+    delFamilia.set(n, bloque);
+  }
+  return { bloques, desconocidas, extras: extrasLeidos };
+}
+
+/** Comprueba que los N de una familia son 1..k sin saltos y devuelve k. */
+function exigirContiguos(
+  prefijo: string,
+  bloques: Map<number, Bloque>,
+  ruta: string,
+  fallar: (m: string) => Error
+): number {
+  const numeros = [...bloques.keys()].sort((a, b) => a - b);
+  for (let i = 0; i < numeros.length; i++) {
+    if (numeros[i] !== i + 1) {
+      throw fallar(
+        `[ERROR] ${ruta}: faltan las claves "${prefijo}_${i + 1}_*" (hay "${prefijo}_${numeros[i]}_*"). ` +
+          'Numera las entradas desde 1 y sin saltos.'
+      );
+    }
+  }
+  return numeros.length;
+}
+
+function exigir(bloque: Bloque, prefijo: string, n: number, campo: string, ruta: string, fallar: (m: string) => Error): Valor {
+  const v = bloque.get(campo);
+  if (v === undefined) {
+    throw fallar(`[ERROR] ${ruta}: falta la clave obligatoria "${prefijo}_${n}_${campo}".`);
+  }
+  return v;
+}
+
+function texto(v: Valor, clave: string, ruta: string, fallar: (m: string) => Error): string {
+  if (typeof v.valor !== 'string' || v.valor.trim() === '') {
+    throw fallar(`[ERROR] ${ruta}:${v.numeroLinea}: "${clave}" debe ser un texto no vacio.`);
+  }
+  return v.valor.trim();
+}
+
+function lista(v: Valor, clave: string, ruta: string, fallar: (m: string) => Error): string[] {
+  if (!Array.isArray(v.valor) || v.valor.length === 0 || v.valor.some((x) => typeof x !== 'string' || x.trim() === '')) {
+    throw fallar(`[ERROR] ${ruta}:${v.numeroLinea}: "${clave}" debe ser una lista no vacia de textos: [a, b].`);
+  }
+  return (v.valor as string[]).map((x) => x.trim());
+}
+
+function enumerado<T extends string>(
+  v: Valor,
+  clave: string,
+  validos: readonly T[],
+  ruta: string,
+  fallar: (m: string) => Error
+): T {
+  const t = typeof v.valor === 'string' ? v.valor.trim() : '';
+  if (!(validos as readonly string[]).includes(t)) {
+    throw fallar(`[ERROR] ${ruta}:${v.numeroLinea}: "${clave}" vale "${String(v.valor)}", pero debe ser uno de: ${validos.join(', ')}.`);
+  }
+  return t as T;
+}
+
+function valorEntero(par: ParClaveValor | undefined, clave: string, ruta: string, fallar: (m: string) => Error): number {
+  if (par === undefined) throw fallar(`[ERROR] ${ruta}: falta la clave obligatoria "${clave}".`);
+  if (typeof par.valor !== 'number' || !Number.isInteger(par.valor) || par.valor < 0) {
+    throw fallar(`[ERROR] ${ruta}:${par.numeroLinea}: "${clave}" debe ser un entero no negativo.`);
+  }
+  return par.valor;
+}
+
+const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
+
+function construirPunto(
+  bloque: Bloque,
+  n: number,
+  ruta: string,
+  origen: 'plugin' | 'proyecto',
+  idsDeTipo: ReadonlySet<string>,
+  fallar: (m: string) => Error
+): PuntoCatalogo {
+  const p = `punto_${n}`;
+  const cId = exigir(bloque, 'punto', n, 'id', ruta, fallar);
+  const id = texto(cId, `${p}_id`, ruta, fallar);
+  if (!ID_RE.test(id)) {
+    throw fallar(`[ERROR] ${ruta}:${cId.numeroLinea}: "${p}_id" vale "${id}"; usa minusculas, digitos y guiones (p. ej. "mi-punto").`);
+  }
+  const severidad = enumerado(exigir(bloque, 'punto', n, 'severidad', ruta, fallar), `${p}_severidad`, SEVERIDADES, ruta, fallar);
+  const cTipos = exigir(bloque, 'punto', n, 'tipos', ruta, fallar);
+  const tipos = lista(cTipos, `${p}_tipos`, ruta, fallar);
+  for (const t of tipos) {
+    if (t !== TIPO_TODOS && !idsDeTipo.has(t)) {
+      throw fallar(
+        `[ERROR] ${ruta}:${cTipos.numeroLinea}: "${p}_tipos" nombra el tipo "${t}", que no existe. ` +
+          `Tipos validos: ${TIPO_TODOS}, ${[...idsDeTipo].join(', ')}.`
+      );
+    }
+  }
+  const cMetodo = exigir(bloque, 'punto', n, 'metodo', ruta, fallar);
+  const metodo = enumerado(cMetodo, `${p}_metodo`, METODOS, ruta, fallar);
+  const cSonda = bloque.get('sonda');
+  let sonda: string | null = null;
+  if (metodo === 'determinista') {
+    if (cSonda === undefined) {
+      throw fallar(`[ERROR] ${ruta}:${cMetodo.numeroLinea}: "${p}_metodo: determinista" exige "${p}_sonda".`);
+    }
+    sonda = texto(cSonda, `${p}_sonda`, ruta, fallar);
+    if (!SONDAS_REGISTRADAS.includes(sonda)) {
+      throw fallar(
+        `[ERROR] ${ruta}:${cSonda.numeroLinea}: "${p}_sonda" vale "${sonda}", que no es una comprobacion registrada. ` +
+          `Las que hay: ${SONDAS_REGISTRADAS.join(', ')}. Para algo distinto usa "${p}_metodo: juicio".`
+      );
+    }
+  } else if (cSonda !== undefined) {
+    throw fallar(`[ERROR] ${ruta}:${cSonda.numeroLinea}: "${p}_sonda" no tiene sentido con "${p}_metodo: juicio". Borra la linea.`);
+  }
+  const arreglo = texto(exigir(bloque, 'punto', n, 'arreglo', ruta, fallar), `${p}_arreglo`, ruta, fallar);
+  const descripcion = texto(exigir(bloque, 'punto', n, 'descripcion', ruta, fallar), `${p}_descripcion`, ruta, fallar);
+  const cRef = bloque.get('referencia');
+  const referencia = cRef === undefined ? null : texto(cRef, `${p}_referencia`, ruta, fallar);
+  return { id, severidad, tipos, metodo, sonda, arreglo, descripcion, referencia, origen };
+}
+
+// ---------------------------------------------------------------------
+// Catalogo del plugin
+// ---------------------------------------------------------------------
+
+export function cargarCatalogoDeploy(ruta?: string): CatalogoBase {
+  const rutaFinal = ruta ?? resolverRutaCatalogoDeploy();
+  let contenido: string;
+  try {
+    contenido = readFileSync(rutaFinal, 'utf8');
+  } catch (e: unknown) {
+    const msg = e instanceof Error ? e.message : String(e);
+    throw new DoctorDeployCatalogoError(
+      `[ERROR] No se pudo leer el catalogo de doctor-deploy "${rutaFinal}": ${msg}\n` +
+        '        Ese fichero lo trae el plugin. Reinstalalo, o define CLAUDE_PLUGIN_ROOT\n' +
+        '        apuntando a la raiz del plugin si lo ejecutas desde otro sitio.'
+    );
+  }
+  return parsearCatalogoDeploy(contenido, rutaFinal);
+}
+
+export function parsearCatalogoDeploy(contenido: string, ruta: string): CatalogoBase {
+  const fallar = (m: string): Error => new DoctorDeployCatalogoError(m);
+  const { pares } = parseBloqueClaveValor(contenido.split(/\r?\n/), 0, {
+    etiqueta: 'catalogo de doctor-deploy',
+    crearError: (m) => new DoctorDeployCatalogoError(`[ERROR] ${ruta}: ${m}`),
+    permitirComentariosDeLinea: true,
+  });
+  const g = agrupar(
+    pares,
+    [
+      { prefijo: 'tipo', campos: CAMPOS_TIPO },
+      { prefijo: 'punto', campos: CAMPOS_PUNTO },
+    ],
+    ['total_tipos', 'total_puntos'],
+    ruta,
+    fallar
+  );
+  const desconocida = g.desconocidas[0];
+  if (desconocida !== undefined) {
+    throw fallar(`[ERROR] ${ruta}:${desconocida.numeroLinea}: clave desconocida "${desconocida.clave}". Si es un error de tecleo, corrigela.`);
+  }
+  const totalTipos = valorEntero(g.extras.get('total_tipos'), 'total_tipos', ruta, fallar);
+  const totalPuntos = valorEntero(g.extras.get('total_puntos'), 'total_puntos', ruta, fallar);
+
+  const bloquesTipo = g.bloques.get('tipo') as Map<number, Bloque>;
+  const bloquesPunto = g.bloques.get('punto') as Map<number, Bloque>;
+  if (exigirContiguos('tipo', bloquesTipo, ruta, fallar) !== totalTipos) {
+    throw fallar(`[ERROR] ${ruta}: "total_tipos" dice ${totalTipos}, pero hay ${bloquesTipo.size} tipos. Corrige el total o las entradas.`);
+  }
+  if (exigirContiguos('punto', bloquesPunto, ruta, fallar) !== totalPuntos) {
+    throw fallar(`[ERROR] ${ruta}: "total_puntos" dice ${totalPuntos}, pero hay ${bloquesPunto.size} puntos. Corrige el total o las entradas.`);
+  }
+
+  const tipos: TipoApp[] = [];
+  for (let n = 1; n <= totalTipos; n++) {
+    const b = bloquesTipo.get(n) as Bloque;
+    const id = texto(exigir(b, 'tipo', n, 'id', ruta, fallar), `tipo_${n}_id`, ruta, fallar);
+    if (!ID_RE.test(id) || id === TIPO_TODOS) {
+      throw fallar(`[ERROR] ${ruta}: "tipo_${n}_id" vale "${id}"; usa minusculas, digitos y guiones, y no "${TIPO_TODOS}".`);
+    }
+    const nombre = b.has('nombre') ? texto(b.get('nombre') as Valor, `tipo_${n}_nombre`, ruta, fallar) : id;
+    const marcadores = lista(exigir(b, 'tipo', n, 'marcadores', ruta, fallar), `tipo_${n}_marcadores`, ruta, fallar);
+    tipos.push({ id, nombre, marcadores });
+  }
+  const idsTipo = new Set<string>();
+  for (const t of tipos) {
+    if (idsTipo.has(t.id)) throw fallar(`[ERROR] ${ruta}: el tipo "${t.id}" esta repetido.`);
+    idsTipo.add(t.id);
+  }
+
+  const puntos: PuntoCatalogo[] = [];
+  const idsPunto = new Set<string>();
+  for (let n = 1; n <= totalPuntos; n++) {
+    const p = construirPunto(bloquesPunto.get(n) as Bloque, n, ruta, 'plugin', idsTipo, fallar);
+    if (idsPunto.has(p.id)) throw fallar(`[ERROR] ${ruta}: el punto "${p.id}" esta repetido.`);
+    idsPunto.add(p.id);
+    puntos.push(p);
+  }
+  return { tipos, puntos };
+}
+
+// ---------------------------------------------------------------------
+// Capa del proyecto
+// ---------------------------------------------------------------------
+
+const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
+
+export function cargarCapaProyecto(repoRoot: string, base: CatalogoBase): CapaProyecto {
+  const ruta = path.join(repoRoot, RUTA_CAPA_PROYECTO);
+  let contenido: string;
+  try {
+    contenido = readFileSync(ruta, 'utf8');
+  } catch (e: unknown) {
+    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
+      return { desactivados: [], anadidos: [], silencios: [], avisos: [] };
+    }
+    const msg = e instanceof Error ? e.message : String(e);
+    throw new DoctorDeployCatalogoError(`[ERROR] No se pudo leer "${ruta}": ${msg}`);
+  }
+  return parsearCapaProyecto(contenido, ruta, base);
+}
+
+export function parsearCapaProyecto(contenido: string, ruta: string, base: CatalogoBase): CapaProyecto {
+  const fallar = (m: string): Error => new DoctorDeployCatalogoError(m);
+  const { pares } = parseBloqueClaveValor(contenido.split(/\r?\n/), 0, {
+    etiqueta: 'doctor-deploy del proyecto',
+    crearError: (m) => new DoctorDeployCatalogoError(`[ERROR] ${ruta}: ${m}`),
+    permitirComentariosDeLinea: true,
+  });
+  const g = agrupar(
+    pares,
+    [
+      { prefijo: 'desactivar', campos: CAMPOS_DESACTIVAR },
+      { prefijo: 'punto', campos: CAMPOS_PUNTO },
+      { prefijo: 'silenciar', campos: CAMPOS_SILENCIAR },
+    ],
+    [],
+    ruta,
+    fallar
+  );
+  const avisos = g.desconocidas.map(
+    (p) => `${ruta}:${p.numeroLinea}: clave desconocida "${p.clave}" (se ignora).`
+  );
+
+  const idsBase = new Set(base.puntos.map((p) => p.id));
+  const idsTipo = new Set(base.tipos.map((t) => t.id));
+
+  // desactivar
+  const bDes = g.bloques.get('desactivar') as Map<number, Bloque>;
+  const nDes = exigirContiguos('desactivar', bDes, ruta, fallar);
+  const desactivados: Array<{ id: string; motivo: string }> = [];
+  for (let n = 1; n <= nDes; n++) {
+    const b = bDes.get(n) as Bloque;
+    const id = texto(exigir(b, 'desactivar', n, 'id', ruta, fallar), `desactivar_${n}_id`, ruta, fallar);
+    const cMotivo = b.get('motivo');
+    if (cMotivo === undefined || typeof cMotivo.valor !== 'string' || cMotivo.valor.trim() === '') {
+      throw fallar(
+        `[ERROR] ${ruta}: desactivar el punto "${id}" exige "desactivar_${n}_motivo" (es una aceptacion de riesgo: ` +
+          'di por que no aplica o quien la asume).'
+      );
+    }
+    desactivados.push({ id, motivo: cMotivo.valor.trim() });
+  }
+
+  // puntos anadidos
+  const bPun = g.bloques.get('punto') as Map<number, Bloque>;
+  const nPun = exigirContiguos('punto', bPun, ruta, fallar);
+  const anadidos: PuntoCatalogo[] = [];
+  const idsVistos = new Set<string>(idsBase);
+  for (let n = 1; n <= nPun; n++) {
+    const p = construirPunto(bPun.get(n) as Bloque, n, ruta, 'proyecto', idsTipo, fallar);
+    if (idsVistos.has(p.id)) {
+      throw fallar(
+        `[ERROR] ${ruta}: el punto "${p.id}" ya existe ` +
+          `${idsBase.has(p.id) ? 'en el catalogo del plugin' : 'en este mismo fichero'}; un proyecto no puede redefinirlo. ` +
+          'Usa otro id.'
+      );
+    }
+    idsVistos.add(p.id);
+    anadidos.push(p);
+  }
+
+  // silencios
+  const bSil = g.bloques.get('silenciar') as Map<number, Bloque>;
+  const nSil = exigirContiguos('silenciar', bSil, ruta, fallar);
+  const silencios: Silencio[] = [];
+  for (let n = 1; n <= nSil; n++) {
+    const b = bSil.get(n) as Bloque;
+    const t = (campo: (typeof CAMPOS_SILENCIAR)[number]): string =>
+      texto(exigir(b, 'silenciar', n, campo, ruta, fallar), `silenciar_${n}_${campo}`, ruta, fallar);
+    const patron = t('patron');
+    const fichero = t('fichero').replace(/\\/g, '/');
+    const motivo = t('motivo');
+    const quien = t('quien');
+    const cFecha = exigir(b, 'silenciar', n, 'fecha', ruta, fallar);
+    const fecha = texto(cFecha, `silenciar_${n}_fecha`, ruta, fallar);
+    if (!FECHA_RE.test(fecha)) {
+      throw fallar(`[ERROR] ${ruta}:${cFecha.numeroLinea}: "silenciar_${n}_fecha" vale "${fecha}"; usa AAAA-MM-DD.`);
+    }
+    const cCommit = b.get('commit');
+    let commit: string | null = null;
+    if (cCommit !== undefined) {
+      if (typeof cCommit.valor === 'number') {
+        throw fallar(
+          `[ERROR] ${ruta}:${cCommit.numeroLinea}: "silenciar_${n}_commit" son solo digitos y se leeria como un numero: ponlo entre comillas ("1234567").`
+        );
+      }
+      commit = texto(cCommit, `silenciar_${n}_commit`, ruta, fallar).toLowerCase();
+      if (!/^[0-9a-f]{7,40}$/.test(commit)) {
+        throw fallar(`[ERROR] ${ruta}:${cCommit.numeroLinea}: "silenciar_${n}_commit" debe ser un hash de commit de 7 a 40 caracteres hexadecimales.`);
+      }
+    }
+    silencios.push({ numero: n, patron, fichero, commit, motivo, quien, fecha });
+  }
+
+  // id desconocido en desactivar: aviso (se comprueba contra base + anadidos)
+  for (const d of desactivados) {
+    if (!idsVistos.has(d.id)) {
+      avisos.push(`${ruta}: "desactivar" nombra el punto "${d.id}", que no existe (se ignora).`);
+    }
+  }
+  return { desactivados, anadidos, silencios, avisos };
+}
+
+/** Une el catalogo del plugin con la capa del proyecto. */
+export function combinarCatalogo(base: CatalogoBase, capa: CapaProyecto): CatalogoEfectivo {
+  const puntos = [...base.puntos, ...capa.anadidos];
+  const ids = new Set(puntos.map((p) => p.id));
+  const desactivados = new Map<string, string>();
+  for (const d of capa.desactivados) if (ids.has(d.id)) desactivados.set(d.id, d.motivo);
+  return { tipos: base.tipos, puntos, desactivados, silencios: capa.silencios, avisos: [...capa.avisos] };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy.ts
new file mode 100644
index 0000000..c171a01
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy.ts
@@ -0,0 +1,245 @@
+/**
+ * Nucleo puro de `taskctl doctor-deploy` (TASK-066): el modelo de un punto, los
+ * cuatro estados, el codigo de salida y los formatos de salida (texto, JSON e
+ * informe en Markdown). No toca disco ni lanza procesos; la orquestacion esta
+ * en commands/doctor-deploy.ts y las comprobaciones en fs/sondas-deploy.ts.
+ *
+ * Estados:
+ * - `ok`: se comprobo y esta bien. Exige evidencia (al menos una): nunca OK
+ *   porque no se encontro nada sin decir donde se busco.
+ * - `falla`: se comprobo y esta mal. Lleva su evidencia y el arreglo.
+ * - `no-verificado`: no se pudo comprobar (falta una herramienta, o el punto
+ *   pide juicio). Dice que falta. NO cambia el codigo de salida, pero el
+ *   resumen cuenta cuantos puntos quedaron sin verificar.
+ * - `no-aplica`: el punto no corresponde a los tipos detectados (o el
+ *   proyecto lo desactivo). Dice por que.
+ *
+ * `Evidencia` NO tiene campo para el valor crudo de un secreto: lo enmascara
+ * quien la crea. El enmascarado de la salida final (segunda red) lo aplica el
+ * comando con `ocultarSecretos`.
+ */
+import type { Metodo, Severidad } from './doctor-deploy-catalogo.js';
+
+export type EstadoPunto = 'ok' | 'falla' | 'no-verificado' | 'no-aplica';
+
+export interface Evidencia {
+  /** Que se vio, en una frase. Nunca el valor de un secreto. */
+  descripcion: string;
+  fichero?: string;
+  linea?: number;
+  commit?: string;
+  /** Valor ya enmascarado (`AKIA**** (20 caracteres)`). */
+  muestra?: string;
+}
+
+/** Lo que devuelve una sonda; el comando le pone el id y el resto. */
+export interface ResultadoSonda {
+  estado: EstadoPunto;
+  /** Una frase: por que sale en ese estado, o que falta. */
+  motivo: string;
+  evidencias: Evidencia[];
+}
+
+export interface ResultadoPunto extends ResultadoSonda {
+  id: string;
+  severidad: Severidad;
+  metodo: Metodo;
+  arreglo: string;
+  descripcion: string;
+  referencia: string | null;
+  /** true si el proyecto desactivo el punto (sale NO APLICA con su motivo). */
+  desactivado: boolean;
+}
+
+export interface TipoDetectado {
+  id: string;
+  nombre: string;
+  /** Carpetas (relativas a la raiz, `.` = la raiz) donde se encontro algun marcador. */
+  rutas: string[];
+}
+
+export interface InformeDeploy {
+  /** Version del formato del JSON: la que extienda TASK-067 sube este numero. */
+  version: 1;
+  comando: 'doctor-deploy';
+  /** Fecha y hora de la ejecucion (ISO 8601 UTC). */
+  fecha: string;
+  commit: string | null;
+  rama: string | null;
+  /** true si habia cambios sin commitear al ejecutar. */
+  arbolSucio: boolean;
+  tipos: TipoDetectado[];
+  avisos: string[];
+  puntos: ResultadoPunto[];
+}
+
+export interface ResumenDeploy {
+  ok: number;
+  falla: number;
+  noVerificado: number;
+  noAplica: number;
+  total: number;
+}
+
+export function resumir(puntos: readonly ResultadoPunto[]): ResumenDeploy {
+  const cuenta = (e: EstadoPunto): number => puntos.filter((p) => p.estado === e).length;
+  return {
+    ok: cuenta('ok'),
+    falla: cuenta('falla'),
+    noVerificado: cuenta('no-verificado'),
+    noAplica: cuenta('no-aplica'),
+    total: puntos.length,
+  };
+}
+
+/** 1 si algun punto FALLA; NO VERIFICADO y NO APLICA no cuentan. */
+export function codigoSalida(puntos: readonly ResultadoPunto[]): 0 | 1 {
+  return puntos.some((p) => p.estado === 'falla') ? 1 : 0;
+}
+
+/**
+ * Invariante «ningun OK sin evidencia»: un OK sin evidencias se degrada a NO
+ * VERIFICADO, para que ni un fallo de una sonda lo deje pasar.
+ */
+export function sanearPunto(p: ResultadoPunto): ResultadoPunto {
+  if (p.estado === 'ok' && p.evidencias.length === 0) {
+    return {
+      ...p,
+      estado: 'no-verificado',
+      motivo: `la comprobacion no aporto evidencia de que este bien (${p.motivo})`,
+    };
+  }
+  return p;
+}
+
+const ETIQUETA_ESTADO: Record<EstadoPunto, string> = {
+  ok: 'OK',
+  falla: 'FALLA',
+  'no-verificado': 'NO VERIFICADO',
+  'no-aplica': 'NO APLICA',
+};
+
+export function etiquetaEstado(e: EstadoPunto): string {
+  return ETIQUETA_ESTADO[e];
+}
+
+/** Una evidencia en una linea: `fichero:linea (commit abc1234) descripcion [muestra]`. */
+export function textoEvidencia(e: Evidencia): string {
+  const donde =
+    e.fichero === undefined ? '' : e.linea === undefined ? `${e.fichero}: ` : `${e.fichero}:${e.linea}: `;
+  const commit = e.commit === undefined ? '' : ` (commit ${e.commit})`;
+  const muestra = e.muestra === undefined ? '' : ` [${e.muestra}]`;
+  return `${donde}${e.descripcion}${commit}${muestra}`;
+}
+
+export function textoResumen(r: ResumenDeploy): string {
+  const sinVerificar = `${r.noVerificado} de ${r.total} sin verificar`;
+  return (
+    `Resumen: ${r.ok} OK, ${r.falla} FALLA, ${r.noVerificado} NO VERIFICADO, ${r.noAplica} NO APLICA. ` +
+    `${sinVerificar}.`
+  );
+}
+
+function textoTipos(tipos: readonly TipoDetectado[]): string {
+  if (tipos.length === 0) return 'ninguno (sin ficheros marcadores: los puntos que dependen de un tipo salen NO APLICA)';
+  return tipos.map((t) => `${t.nombre} (${t.rutas.join(', ')})`).join('; ');
+}
+
+/** Maximo de evidencias que se listan por punto en la salida de texto. */
+const MAX_EVIDENCIAS_TEXTO = 12;
+
+export function formatearTexto(informe: InformeDeploy): string {
+  const r = resumir(informe.puntos);
+  const l: string[] = [];
+  l.push('taskctl doctor-deploy');
+  l.push(`Commit: ${informe.commit ?? '(sin commits)'}   Rama: ${informe.rama ?? '(desconocida)'}${informe.arbolSucio ? '   ARBOL SUCIO: lo comprobado puede no ser lo publicado' : ''}`);
+  l.push(`Tipos detectados: ${textoTipos(informe.tipos)}`);
+  for (const a of informe.avisos) l.push(`[AVISO] ${a}`);
+  l.push('');
+  for (const p of informe.puntos) {
+    const marca = `[${etiquetaEstado(p.estado)}]`;
+    l.push(`${marca} ${p.id} (${p.severidad}, ${p.metodo})${p.desactivado ? ' DESACTIVADO' : ''}: ${p.motivo}`);
+    if (p.estado === 'falla' || p.estado === 'ok') {
+      for (const e of p.evidencias.slice(0, MAX_EVIDENCIAS_TEXTO)) l.push(`    - ${textoEvidencia(e)}`);
+      if (p.evidencias.length > MAX_EVIDENCIAS_TEXTO) {
+        l.push(`    - ... y ${p.evidencias.length - MAX_EVIDENCIAS_TEXTO} mas (todas en --json)`);
+      }
+    }
+    if (p.estado === 'falla') l.push(`    Arreglo: ${p.arreglo}`);
+  }
+  l.push('');
+  l.push(textoResumen(r));
+  if (r.falla === 0 && r.noVerificado > 0) {
+    l.push(
+      `Sin FALLA no es «listo para publicar»: ${r.noVerificado} puntos no se han podido comprobar y siguen ` +
+        'pendientes (los de juicio, hasta que se revisen con criterio; los de herramienta, hasta instalarla).'
+    );
+  }
+  l.push(r.falla === 0 ? 'Salida 0.' : `Salida 1: ${r.falla} punto(s) FALLA.`);
+  return `${l.join('\n')}\n`;
+}
+
+/** Una sola linea de JSON; el contrato que extendera TASK-067. */
+export function formatearJson(informe: InformeDeploy): string {
+  const resumen = resumir(informe.puntos);
+  return `${JSON.stringify({ ...informe, resumen, codigo: codigoSalida(informe.puntos) })}\n`;
+}
+
+function celda(t: string): string {
+  return t.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
+}
+
+/** Informe en Markdown para `--escribir`. */
+export function formatearInforme(informe: InformeDeploy): string {
+  const r = resumir(informe.puntos);
+  const l: string[] = [];
+  l.push('# Informe de doctor-deploy');
+  l.push('');
+  l.push(
+    'Informe de uso interno de las comprobaciones previas a publicar. Describe el commit indicado y ' +
+      'nada mas: no es una certificacion ni una auditoria de terceros.'
+  );
+  l.push('');
+  l.push(`- Fecha: ${informe.fecha}`);
+  l.push(`- Commit: ${informe.commit ?? '(sin commits)'}`);
+  l.push(`- Rama: ${informe.rama ?? '(desconocida)'}`);
+  l.push(
+    `- Arbol de trabajo: ${informe.arbolSucio ? 'SUCIO (habia cambios sin commitear: este informe puede no describir lo que se publica)' : 'limpio'}`
+  );
+  l.push(`- Tipos detectados: ${textoTipos(informe.tipos)}`);
+  l.push(`- ${textoResumen(r)}`);
+  l.push(`- Codigo de salida: ${codigoSalida(informe.puntos)}`);
+  l.push('');
+  if (informe.avisos.length > 0) {
+    l.push('## Avisos');
+    l.push('');
+    for (const a of informe.avisos) l.push(`- ${a}`);
+    l.push('');
+  }
+  l.push('## Puntos');
+  l.push('');
+  l.push('| Punto | Severidad | Metodo | Estado | Detalle |');
+  l.push('|---|---|---|---|---|');
+  for (const p of informe.puntos) {
+    l.push(
+      `| ${celda(p.id)} | ${p.severidad} | ${p.metodo} | ${etiquetaEstado(p.estado)} | ${celda(p.motivo)}${p.desactivado ? ' (desactivado)' : ''} |`
+    );
+  }
+  l.push('');
+  const conEvidencia = informe.puntos.filter((p) => p.estado === 'falla' || p.estado === 'ok');
+  if (conEvidencia.length > 0) {
+    l.push('## Evidencias');
+    l.push('');
+    for (const p of conEvidencia) {
+      l.push(`### ${p.id} - ${etiquetaEstado(p.estado)}`);
+      l.push('');
+      for (const e of p.evidencias) l.push(`- ${textoEvidencia(e)}`);
+      if (p.estado === 'falla') {
+        l.push('');
+        l.push(`Arreglo: ${p.arreglo}`);
+      }
+      l.push('');
+    }
+  }
+  return `${l.join('\n')}\n`;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts
new file mode 100644
index 0000000..b05ad36
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/secretos.ts
@@ -0,0 +1,179 @@
+/**
+ * Patrones de claves y secretos de `taskctl doctor-deploy` (TASK-066) y su
+ * enmascarado. Modulo puro: no toca disco ni lanza procesos.
+ *
+ * Tres clases de hallazgo:
+ * - `secreto`: una clave que no debe estar en el repositorio (sk_live_,
+ *   service_role de Supabase, AKIA de AWS, clave privada...).
+ * - `publica`: una clave hecha para ser publica (anon / publishable de
+ *   Supabase, apiKey `AIza` de la config web de Firebase). No es un fallo.
+ * - `ejemplo`: una clave de ejemplo o de prueba (AKIAIOSFODNN7EXAMPLE,
+ *   sk_test_). Tampoco es un fallo.
+ *
+ * Enmascarado: el valor crudo de un secreto NO sale nunca de aqui. `muestra`
+ * lleva como mucho los 4 primeros caracteres y la longitud. Ademas
+ * `ocultarSecretos` es la segunda red: reescribe cualquier texto que vaya a
+ * salir (stdout, JSON, informe en disco, stderr) por si algo se coló.
+ */
+
+export type ClaseSecreto = 'secreto' | 'publica' | 'ejemplo';
+
+export interface HallazgoSecreto {
+  /** Id estable del patron (`aws-access-key`...): lo que se usa para silenciar. */
+  patron: string;
+  clase: ClaseSecreto;
+  /** Linea (1-based) donde empieza el hallazgo. */
+  linea: number;
+  /** Valor enmascarado: nunca el crudo. */
+  muestra: string;
+}
+
+interface Clasificacion {
+  clase: ClaseSecreto;
+  /** Id del patron si depende del contenido (JWT de Supabase: anon o service_role). */
+  patron?: string;
+}
+
+interface PatronSecreto {
+  id: string;
+  re: RegExp;
+  /** Por defecto `secreto`. `null` = descartar la coincidencia. */
+  clasificar?: (coincidencia: RegExpExecArray) => Clasificacion | null;
+}
+
+/** Texto que, como contrasena de una URL, es un marcador y no un secreto. */
+const CONTRASENA_MARCADOR = /^(?:password|passwd|pass|contrasena|changeme|secret|example|your[-_]?password|\*+|x+|\.{3,}|<[^>]*>|\$\{[^}]*\}|\{\{[^}]*\}\}|%[^%]+%)$/i;
+const HOST_LOCAL = /^(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|.*\.?example(?:\.[a-z]+)?|.*\.local|.*\.test|.*\.invalid)$/i;
+
+function decodificarPayloadJwt(jwt: string): Record<string, unknown> | null {
+  const partes = jwt.split('.');
+  const payload = partes[1];
+  if (payload === undefined) return null;
+  try {
+    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
+    const o: unknown = JSON.parse(json);
+    return typeof o === 'object' && o !== null && !Array.isArray(o) ? (o as Record<string, unknown>) : null;
+  } catch {
+    return null;
+  }
+}
+
+/**
+ * Patrones de alta precision: se prefiere perder una clave rara a inundar el
+ * informe de falsos positivos (la gente deja de leerlo). Cada uno lleva el
+ * flag `g` y se usa solo con `matchAll` / `exec` en bucle sobre una copia.
+ */
+const PATRONES: readonly PatronSecreto[] = [
+  {
+    id: 'aws-access-key',
+    re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
+    clasificar: (m) => (m[0].includes('EXAMPLE') ? { clase: 'ejemplo' } : { clase: 'secreto' }),
+  },
+  { id: 'stripe-live', re: /\b[sr]k_live_[0-9A-Za-z]{10,}/g },
+  { id: 'stripe-publicable', re: /\bpk_live_[0-9A-Za-z]{10,}/g, clasificar: () => ({ clase: 'publica' }) },
+  { id: 'stripe-test', re: /\b[sr]k_test_[0-9A-Za-z]{10,}/g, clasificar: () => ({ clase: 'ejemplo' }) },
+  { id: 'github-token', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g },
+  { id: 'github-pat', re: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/g },
+  { id: 'slack-token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/g },
+  { id: 'npm-token', re: /\bnpm_[A-Za-z0-9]{36}\b/g },
+  { id: 'sendgrid-key', re: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g },
+  { id: 'llm-api-key', re: /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{32,}/g },
+  { id: 'supabase-secret', re: /\bsb_secret_[A-Za-z0-9_-]{20,}/g },
+  { id: 'supabase-publishable', re: /\bsb_publishable_[A-Za-z0-9_-]{20,}/g, clasificar: () => ({ clase: 'publica' }) },
+  { id: 'firebase-web-api-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/g, clasificar: () => ({ clase: 'publica' }) },
+  {
+    // Los JWT de Supabase: `anon` es publica, `service_role` no. Cualquier otro
+    // JWT (sesiones, ejemplos de documentacion) se descarta.
+    id: 'supabase-jwt',
+    re: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
+    clasificar: (m) => {
+      const rol = decodificarPayloadJwt(m[0])?.['role'];
+      if (rol === 'service_role') return { clase: 'secreto', patron: 'supabase-service-role' };
+      if (rol === 'anon') return { clase: 'publica', patron: 'supabase-anon' };
+      return null;
+    },
+  },
+  { id: 'clave-privada', re: /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY(?: BLOCK)?-----/g },
+  {
+    id: 'url-con-credenciales',
+    re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@'"`]+:([^\s@/'"`]{8,})@([^\s/:'"`]+)/gi,
+    clasificar: (m) => {
+      const contrasena = m[1] ?? '';
+      const host = m[2] ?? '';
+      if (CONTRASENA_MARCADOR.test(contrasena) || HOST_LOCAL.test(host)) return null;
+      return { clase: 'secreto' };
+    },
+  },
+];
+
+/** Los ids de patron que existen (para documentar y para validar silencios). */
+export const IDS_PATRON: readonly string[] = [
+  ...PATRONES.map((p) => p.id),
+  'supabase-service-role',
+  'supabase-anon',
+];
+
+/** Valor enmascarado: 4 caracteres como mucho + la longitud. Nunca el crudo. */
+export function enmascarar(valor: string): string {
+  const visibles = Math.min(4, Math.floor(valor.length / 4));
+  return `${valor.slice(0, visibles)}**** (${valor.length} caracteres)`;
+}
+
+/** Linea (1-based) de la posicion `indice` en `texto`, contando desde `desde`. */
+function lineaDe(texto: string, indice: number, desde: { indice: number; linea: number }): number {
+  let linea = desde.linea;
+  for (let i = desde.indice; i < indice; i++) {
+    if (texto.charCodeAt(i) === 10) linea++;
+  }
+  desde.indice = indice;
+  desde.linea = linea;
+  return linea;
+}
+
+/**
+ * Todos los hallazgos de `texto`, de cualquier clase, en orden de aparicion.
+ * El valor crudo no se devuelve.
+ */
+export function buscarSecretos(texto: string): HallazgoSecreto[] {
+  const encontrados: Array<{ indice: number; h: Omit<HallazgoSecreto, 'linea'> }> = [];
+  for (const p of PATRONES) {
+    const re = new RegExp(p.re.source, p.re.flags);
+    let m: RegExpExecArray | null;
+    while ((m = re.exec(texto)) !== null) {
+      if (m[0] === '') {
+        re.lastIndex++;
+        continue;
+      }
+      const c = p.clasificar === undefined ? ({ clase: 'secreto' } as Clasificacion) : p.clasificar(m);
+      if (c === null) continue;
+      encontrados.push({
+        indice: m.index,
+        h: { patron: c.patron ?? p.id, clase: c.clase, muestra: enmascarar(m[0]) },
+      });
+    }
+  }
+  encontrados.sort((a, b) => a.indice - b.indice);
+  const cursor = { indice: 0, linea: 1 };
+  return encontrados.map((e) => ({ ...e.h, linea: lineaDe(texto, e.indice, cursor) }));
+}
+
+/**
+ * Segunda red: sustituye por su version enmascarada todo lo que case con un
+ * patron de clave (de cualquier clase) en un texto que va a salir. Se aplica
+ * en el unico punto de salida del comando, para stdout, JSON, informe y
+ * stderr.
+ */
+export function ocultarSecretos(texto: string): string {
+  let t = texto;
+  for (const p of PATRONES) {
+    const re = new RegExp(p.re.source, p.re.flags);
+    t = t.replace(re, (m: string) => {
+      if (p.id === 'url-con-credenciales') {
+        // Solo la contrasena: `esquema://usuario:****@host`.
+        return m.replace(/:\/\/([^\s:/@'"`]+):[^\s@/'"`]+@/, '://$1:****@');
+      }
+      return enmascarar(m);
+    });
+  }
+  return t;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-app.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-app.ts
new file mode 100644
index 0000000..74d6b63
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-app.ts
@@ -0,0 +1,76 @@
+/**
+ * Deteccion del tipo de aplicacion para `taskctl doctor-deploy` (TASK-066).
+ *
+ * Los tipos y sus marcadores son DATOS del catalogo (`tipo_N_*` en
+ * scripts/doctor-deploy.yml): anadir uno no toca este fichero. Se detectan
+ * sobre la lista de ficheros del proyecto que da Git (versionados y sin
+ * versionar que no estan ignorados), hasta una profundidad fija, sin mirar
+ * dentro de las carpetas de dependencias ni de build.
+ */
+import type { TipoApp } from '../core/doctor-deploy-catalogo.js';
+import type { TipoDetectado } from '../core/doctor-deploy.js';
+import { gitTexto } from './git-crudo.js';
+
+/** Carpetas que ni se detectan ni se escanean: dependencias y build. */
+export const DIRS_EXCLUIDOS: readonly string[] = ['node_modules', 'vendor', 'target', 'dist', 'build', '.git'];
+
+/** Profundidad maxima (carpetas) a la que se buscan marcadores: `a/b/c/package.json` si; un nivel mas, no. */
+export const PROFUNDIDAD_MARCADORES = 3;
+
+export function estaExcluido(ruta: string): boolean {
+  return ruta.split('/').some((seg, i, partes) => i < partes.length - 1 && DIRS_EXCLUIDOS.includes(seg));
+}
+
+function listaZ(args: readonly string[], cwd: string): string[] | null {
+  const t = gitTexto(args, cwd, { maxBuffer: 256 * 1024 * 1024 });
+  if (t === null) return null;
+  return t.split('\0').filter((r) => r !== '');
+}
+
+export interface ArchivosProyecto {
+  /** Versionados mas sin versionar que no estan ignorados; sin carpetas excluidas. */
+  presentes: string[];
+  /** Solo los versionados; sin carpetas excluidas. */
+  versionados: string[];
+}
+
+/** null si no se pudo listar (no es un repo Git, o git no esta). */
+export function listarArchivos(cwd: string): ArchivosProyecto | null {
+  const versionados = listaZ(['ls-files', '-z', '--cached'], cwd);
+  const otros = listaZ(['ls-files', '-z', '--others', '--exclude-standard'], cwd);
+  if (versionados === null || otros === null) return null;
+  const sinExcluidos = (xs: string[]): string[] => xs.filter((r) => !estaExcluido(r));
+  const v = sinExcluidos(versionados);
+  const presentes = [...new Set([...v, ...sinExcluidos(otros)])];
+  return { presentes, versionados: v };
+}
+
+function coincideMarcador(ruta: string, marcador: string): boolean {
+  const base = ruta.slice(ruta.lastIndexOf('/') + 1);
+  if (marcador.includes('/')) return ruta === marcador || ruta.endsWith(`/${marcador}`);
+  if (marcador.startsWith('*.')) return base.length > marcador.length - 1 && base.toLowerCase().endsWith(marcador.slice(1).toLowerCase());
+  return base === marcador;
+}
+
+/** Carpeta (con `/`, `.` si es la raiz) de una ruta. */
+export function carpetaDe(ruta: string): string {
+  const i = ruta.lastIndexOf('/');
+  return i === -1 ? '.' : ruta.slice(0, i);
+}
+
+function profundidad(ruta: string): number {
+  return ruta.split('/').length - 1;
+}
+
+export function detectarTipos(archivos: readonly string[], tipos: readonly TipoApp[]): TipoDetectado[] {
+  const candidatos = archivos.filter((r) => profundidad(r) <= PROFUNDIDAD_MARCADORES);
+  const detectados: TipoDetectado[] = [];
+  for (const t of tipos) {
+    const rutas = new Set<string>();
+    for (const r of candidatos) {
+      if (t.marcadores.some((m) => coincideMarcador(r, m))) rutas.add(carpetaDe(r));
+    }
+    if (rutas.size > 0) detectados.push({ id: t.id, nombre: t.nombre, rutas: [...rutas].sort() });
+  }
+  return detectados;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
new file mode 100644
index 0000000..8d68ce7
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-crudo.ts
@@ -0,0 +1,48 @@
+/**
+ * `git` sin lanzar nunca y con la salida en bruto (`Buffer`), para
+ * `taskctl doctor-deploy` (TASK-066): el recorrido del historial lee blobs que
+ * pueden no ser UTF-8, y un fallo de Git tiene que poder convertirse en
+ * «NO VERIFICADO» en vez de en una excepcion.
+ */
+import { spawnSync } from 'node:child_process';
+
+export interface SalidaGitCruda {
+  status: number | null;
+  stdout: Buffer;
+  stderr: string;
+  /** Error de lanzamiento: git no esta, directorio inexistente, timeout o desbordamiento de buffer. */
+  error: Error | undefined;
+}
+
+export interface OpcionesGitCrudo {
+  input?: string | Buffer;
+  maxBuffer?: number;
+  timeoutMs?: number;
+}
+
+const MAX_BUFFER_POR_DEFECTO = 64 * 1024 * 1024;
+const TIMEOUT_POR_DEFECTO_MS = 60_000;
+
+export function gitCrudo(args: readonly string[], cwd: string, opciones: OpcionesGitCrudo = {}): SalidaGitCruda {
+  const r = spawnSync('git', args, {
+    cwd,
+    input: opciones.input,
+    maxBuffer: opciones.maxBuffer ?? MAX_BUFFER_POR_DEFECTO,
+    timeout: opciones.timeoutMs ?? TIMEOUT_POR_DEFECTO_MS,
+    stdio: ['pipe', 'pipe', 'pipe'],
+    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' },
+  });
+  return {
+    status: r.status,
+    stdout: Buffer.isBuffer(r.stdout) ? r.stdout : Buffer.alloc(0),
+    stderr: Buffer.isBuffer(r.stderr) ? r.stderr.toString('utf8') : '',
+    error: r.error,
+  };
+}
+
+/** Salida de texto de un `git` que acabo bien, o null si fallo (en cualquier forma). */
+export function gitTexto(args: readonly string[], cwd: string, opciones: OpcionesGitCrudo = {}): string | null {
+  const r = gitCrudo(args, cwd, opciones);
+  if (r.error !== undefined || r.status !== 0) return null;
+  return r.stdout.toString('utf8');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/herramientas-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/herramientas-deploy.ts
new file mode 100644
index 0000000..15f7017
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/herramientas-deploy.ts
@@ -0,0 +1,130 @@
+/**
+ * Lanzamiento de las herramientas externas de `taskctl doctor-deploy`
+ * (TASK-066): localizarlas en un PATH que se puede controlar (los tests lo
+ * vacian) y ejecutarlas con timeout.
+ *
+ * Presencia y lanzamiento van separados a proposito: en Windows `npm`, `pnpm`
+ * y `yarn` son `.cmd`, y `spawnSync` sin shell devuelve ENOENT para ellos aunque
+ * existan (ya paso con `codex`, ver runCodexReview). Y CON shell, un comando
+ * que no existe no da ENOENT sino un «no se reconoce» con codigo 1. Asi que la
+ * presencia se decide recorriendo el PATH, y solo lo que se encontro se lanza
+ * (con shell unicamente si es un `.cmd`/`.bat` en Windows).
+ */
+import { spawnSync } from 'node:child_process';
+import { statSync } from 'node:fs';
+import path from 'node:path';
+
+/** El PATH del proceso, sea cual sea su capitalizacion (`PATH` o `Path` en Windows). */
+export function pathDelProceso(): string {
+  for (const [k, v] of Object.entries(process.env)) {
+    if (k.toLowerCase() === 'path' && v !== undefined) return v;
+  }
+  return '';
+}
+
+function esEjecutable(ruta: string, plataforma: NodeJS.Platform): boolean {
+  try {
+    const st = statSync(ruta);
+    if (!st.isFile()) return false;
+    return plataforma === 'win32' ? true : (st.mode & 0o111) !== 0;
+  } catch {
+    return false;
+  }
+}
+
+/** Ruta absoluta del ejecutable `nombre` en `pathEnv`, o null si no esta. */
+export function localizarHerramienta(
+  nombre: string,
+  pathEnv: string,
+  plataforma: NodeJS.Platform = process.platform
+): string | null {
+  const dirs = pathEnv.split(path.delimiter).filter((d) => d !== '');
+  const exts =
+    plataforma === 'win32'
+      ? (process.env['PATHEXT'] ?? '.COM;.EXE;.BAT;.CMD').split(';').filter((e) => e !== '')
+      : [''];
+  for (const dir of dirs) {
+    for (const ext of exts) {
+      const candidata = path.join(dir, nombre + ext);
+      if (esEjecutable(candidata, plataforma)) return candidata;
+    }
+  }
+  return null;
+}
+
+export interface EjecucionHerramienta {
+  /** false si ni siquiera arranco (ENOENT, EACCES...). */
+  lanzada: boolean;
+  status: number | null;
+  stdout: string;
+  stderr: string;
+  /** Mensaje del error de lanzamiento, si lo hubo. */
+  error: string | null;
+  timeout: boolean;
+}
+
+const MAX_BUFFER_HERRAMIENTA = 64 * 1024 * 1024;
+
+function entornoDeHerramienta(pathEnv: string): NodeJS.ProcessEnv {
+  const env: NodeJS.ProcessEnv = {};
+  for (const [k, v] of Object.entries(process.env)) {
+    if (k.toLowerCase() !== 'path') env[k] = v;
+  }
+  env['PATH'] = pathEnv;
+  // Salida estable: la que parsean los interpretes esta en ingles y sin color.
+  env['NO_COLOR'] = '1';
+  env['DOTNET_CLI_UI_LANGUAGE'] = 'en';
+  env['DOTNET_NOLOGO'] = '1';
+  env['DOTNET_CLI_TELEMETRY_OPTOUT'] = '1';
+  return env;
+}
+
+export function ejecutarHerramienta(
+  ruta: string,
+  args: readonly string[],
+  cwd: string,
+  pathEnv: string,
+  timeoutMs: number,
+  plataforma: NodeJS.Platform = process.platform
+): EjecucionHerramienta {
+  const conShell = plataforma === 'win32' && /\.(?:cmd|bat)$/i.test(ruta);
+  // Con shell, Node no cita: la ruta (puede llevar espacios) va entre comillas.
+  // Los argumentos son constantes de este modulo, sin caracteres especiales.
+  const comando = conShell ? `"${ruta}"` : ruta;
+  const r = spawnSync(comando, [...args], {
+    cwd,
+    encoding: 'utf8',
+    timeout: timeoutMs,
+    maxBuffer: MAX_BUFFER_HERRAMIENTA,
+    shell: conShell,
+    stdio: ['ignore', 'pipe', 'pipe'],
+    env: entornoDeHerramienta(pathEnv),
+  });
+  const code = (r.error as NodeJS.ErrnoException | undefined)?.code;
+  const timeout = code === 'ETIMEDOUT' || (r.error !== undefined && r.signal === 'SIGTERM');
+  if (r.error !== undefined) {
+    return {
+      lanzada: timeout,
+      status: null,
+      stdout: r.stdout ?? '',
+      stderr: r.stderr ?? '',
+      error: r.error.message,
+      timeout,
+    };
+  }
+  return { lanzada: true, status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '', error: null, timeout: false };
+}
+
+/** Primera linea con algo, recortada: la version que imprime `herramienta --version`. */
+export function versionDe(
+  ruta: string,
+  argsVersion: readonly string[],
+  cwd: string,
+  pathEnv: string,
+  plataforma: NodeJS.Platform = process.platform
+): string {
+  const e = ejecutarHerramienta(ruta, argsVersion, cwd, pathEnv, 15_000, plataforma);
+  if (e.error !== null || e.status !== 0) return 'version desconocida';
+  const linea = e.stdout.split(/\r?\n/).find((l) => l.trim() !== '') ?? '';
+  return linea.trim().slice(0, 60) || 'version desconocida';
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
new file mode 100644
index 0000000..b5ce059
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
@@ -0,0 +1,828 @@
+/**
+ * Las comprobaciones deterministas de `taskctl doctor-deploy` (TASK-066): las
+ * unicas seis que existen. Todo punto del catalogo que no nombra una de estas
+ * sondas es de juicio y sale NO VERIFICADO.
+ *
+ * Reglas que valen para todas:
+ * - Solo leen. Nada se escribe ni se cambia de rama.
+ * - Nunca OK sin evidencia. Si no se pudo mirar (herramienta ausente, historial
+ *   truncado, desbordamiento, timeout, salida que no se entiende), el estado es
+ *   NO VERIFICADO con lo que falta, no OK ni una excepcion.
+ * - El valor de un secreto no sale de aqui: la evidencia lleva solo la muestra
+ *   enmascarada (`buscarSecretos` ya no devuelve el valor crudo).
+ * - Se excluyen node_modules, vendor, target, dist y build.
+ */
+import { readFileSync, mkdtempSync, rmSync, statSync } from 'node:fs';
+import os from 'node:os';
+import path from 'node:path';
+import { buscarSecretos, IDS_PATRON } from '../core/secretos.js';
+import type { Silencio } from '../core/doctor-deploy-catalogo.js';
+import type { Evidencia, ResultadoSonda, TipoDetectado } from '../core/doctor-deploy.js';
+import {
+  interpretarCargoAudit,
+  interpretarDotnetVulnerable,
+  interpretarGovulncheck,
+  interpretarNpmAudit,
+  interpretarPipAudit,
+  interpretarYarnAudit,
+  type VeredictoAuditoria,
+} from '../core/doctor-deploy-auditoria.js';
+import { estaExcluido } from './deteccion-app.js';
+import { gitCrudo, gitTexto } from './git-crudo.js';
+import { ejecutarHerramienta, localizarHerramienta, versionDe } from './herramientas-deploy.js';
+
+export interface OpcionesSondas {
+  /** PATH donde se buscan las herramientas externas (los tests lo controlan). */
+  pathHerramientas: string;
+  timeoutHerramientaMs: number;
+  /** Tiempo total del recorrido del historial. */
+  timeoutHistorialMs: number;
+  /** Mas blobs distintos que esto: el recorrido se corta (NO VERIFICADO). */
+  maxBlobsHistorial: number;
+  /** Un fichero (blob) mayor que esto no se lee. */
+  maxBytesFichero: number;
+}
+
+export const OPCIONES_SONDAS_POR_DEFECTO: Omit<OpcionesSondas, 'pathHerramientas'> = {
+  timeoutHerramientaMs: 120_000,
+  timeoutHistorialMs: 180_000,
+  maxBlobsHistorial: 200_000,
+  maxBytesFichero: 1024 * 1024,
+};
+
+export interface ContextoDeploy {
+  cwd: string;
+  /** Versionados mas sin versionar no ignorados (sin carpetas excluidas). */
+  presentes: string[];
+  versionados: string[];
+  tipos: TipoDetectado[];
+  silencios: Silencio[];
+  /** `numero` de los silencios que taparon algun hallazgo. */
+  silenciosUsados: Set<number>;
+  opciones: OpcionesSondas;
+}
+
+export type Sonda = (ctx: ContextoDeploy) => ResultadoSonda;
+
+const MAX_HALLAZGOS = 200;
+const MAX_BYTES_BINARIO = 8000;
+
+// ---------------------------------------------------------------------
+// Utilidades compartidas
+// ---------------------------------------------------------------------
+
+function esBinario(b: Buffer): boolean {
+  const n = Math.min(b.length, MAX_BYTES_BINARIO);
+  for (let i = 0; i < n; i++) if (b[i] === 0) return true;
+  return false;
+}
+
+function buscarSilencio(ctx: ContextoDeploy, patron: string, fichero: string, commit: string | null): Silencio | null {
+  for (const s of ctx.silencios) {
+    if (s.patron !== patron || s.fichero !== fichero) continue;
+    if (s.commit !== null && (commit === null || !commit.startsWith(s.commit))) continue;
+    ctx.silenciosUsados.add(s.numero);
+    return s;
+  }
+  return null;
+}
+
+function evidenciaSilenciada(s: Silencio, patron: string, fichero: string, linea: number | undefined, commit: string | undefined): Evidencia {
+  const e: Evidencia = {
+    descripcion: `SILENCIADO (silenciar_${s.numero}, patron ${patron}): ${s.motivo} - ${s.quien}, ${s.fecha}`,
+    fichero,
+  };
+  if (linea !== undefined) e.linea = linea;
+  if (commit !== undefined) e.commit = commit;
+  return e;
+}
+
+const nombreBase = (ruta: string): string => ruta.slice(ruta.lastIndexOf('/') + 1);
+
+const ARCHIVOS_DE_BLOQUEO = new Set([
+  'package-lock.json',
+  'npm-shrinkwrap.json',
+  'pnpm-lock.yaml',
+  'yarn.lock',
+  'Cargo.lock',
+  'poetry.lock',
+  'Pipfile.lock',
+  'composer.lock',
+  'Gemfile.lock',
+  'go.sum',
+  'uv.lock',
+]);
+
+// ---------------------------------------------------------------------
+// secretos-arbol
+// ---------------------------------------------------------------------
+
+export const sondaSecretosArbol: Sonda = (ctx) => {
+  const fallos: Evidencia[] = [];
+  const silenciadas: Evidencia[] = [];
+  let revisados = 0;
+  let omitidosGrandes = 0;
+  let publicas = 0;
+  let ejemplos = 0;
+  let cortado = false;
+
+  for (const rel of ctx.presentes) {
+    if (ARCHIVOS_DE_BLOQUEO.has(nombreBase(rel))) continue;
+    const abs = path.join(ctx.cwd, rel);
+    let datos: Buffer;
+    try {
+      const st = statSync(abs);
+      if (!st.isFile()) continue;
+      if (st.size > ctx.opciones.maxBytesFichero) {
+        omitidosGrandes++;
+        continue;
+      }
+      datos = readFileSync(abs);
+    } catch {
+      continue; // borrado o ilegible: no hay nada que escanear
+    }
+    if (esBinario(datos)) continue;
+    revisados++;
+    for (const h of buscarSecretos(datos.toString('utf8'))) {
+      if (h.clase === 'publica') publicas++;
+      else if (h.clase === 'ejemplo') ejemplos++;
+      else {
+        const s = buscarSilencio(ctx, h.patron, rel, null);
+        if (s !== null) {
+          silenciadas.push(evidenciaSilenciada(s, h.patron, rel, h.linea, undefined));
+        } else if (fallos.length < MAX_HALLAZGOS) {
+          fallos.push({ descripcion: `clave secreta (patron ${h.patron})`, fichero: rel, linea: h.linea, muestra: h.muestra });
+        } else {
+          cortado = true;
+        }
+      }
+    }
+  }
+
+  const alcance =
+    `${revisados} ficheros de texto revisados con ${IDS_PATRON.length} patrones de claves` +
+    (omitidosGrandes > 0 ? `; ${omitidosGrandes} omitidos por tamano` : '') +
+    '; excluidos node_modules, vendor, target, dist y build';
+  const notas: Evidencia[] = [];
+  if (publicas + ejemplos > 0) {
+    notas.push({
+      descripcion: `${publicas} claves publicas a proposito (anon, publishable, apiKey web de Firebase) y ${ejemplos} de ejemplo o de prueba: no cuentan`,
+    });
+  }
+
+  if (fallos.length > 0) {
+    return {
+      estado: 'falla',
+      motivo: `${fallos.length}${cortado ? '+' : ''} clave(s) secreta(s) en los ficheros del proyecto`,
+      evidencias: [...fallos, ...silenciadas, ...notas, { descripcion: alcance }],
+    };
+  }
+  if (revisados === 0) {
+    return {
+      estado: 'no-verificado',
+      motivo: 'no se encontro ningun fichero de texto que revisar (el proyecto esta vacio o todo esta excluido)',
+      evidencias: [],
+    };
+  }
+  return {
+    estado: 'ok',
+    motivo: 'ninguna clave secreta en los ficheros del proyecto',
+    evidencias: [{ descripcion: alcance }, ...silenciadas, ...notas],
+  };
+};
+
+// ---------------------------------------------------------------------
+// ficheros-secretos
+// ---------------------------------------------------------------------
+
+const SUFIJOS_DE_EJEMPLO = /\.(?:example|sample|template|dist|defaults?|vault)$/i;
+
+/** Por que este nombre de fichero versionado es un fichero de secretos; null si no lo es. */
+export function motivoFicheroSecreto(ruta: string): string | null {
+  const base = nombreBase(ruta).toLowerCase();
+  if ((base === '.env' || base.startsWith('.env.')) && !SUFIJOS_DE_EJEMPLO.test(base)) return 'fichero .env con variables de entorno';
+  if (/^id_(?:rsa|dsa|ecdsa|ed25519)$/.test(base)) return 'clave privada SSH';
+  if (/\.(?:p12|pfx|jks|keystore)$/.test(base)) return 'almacen de claves privadas';
+  if (base === 'credentials.json' || base === '.htpasswd' || base === '.netrc' || base === '.pgpass') return 'fichero de credenciales';
+  if (ruta.toLowerCase().endsWith('.aws/credentials')) return 'credenciales de AWS';
+  return null;
+}
+
+export const sondaFicherosSecretos: Sonda = (ctx) => {
+  const fallos: Evidencia[] = [];
+  const silenciadas: Evidencia[] = [];
+  for (const rel of ctx.versionados) {
+    const motivo = motivoFicheroSecreto(rel);
+    if (motivo === null) continue;
+    const s = buscarSilencio(ctx, 'fichero-secreto', rel, null);
+    if (s !== null) silenciadas.push(evidenciaSilenciada(s, 'fichero-secreto', rel, undefined, undefined));
+    else fallos.push({ descripcion: `${motivo} versionado`, fichero: rel });
+  }
+  if (fallos.length > 0) {
+    return {
+      estado: 'falla',
+      motivo: `${fallos.length} fichero(s) de secretos versionado(s)`,
+      evidencias: [...fallos, ...silenciadas],
+    };
+  }
+  if (ctx.versionados.length === 0) {
+    return { estado: 'no-verificado', motivo: 'no hay ficheros versionados que revisar (git ls-files vacio)', evidencias: [] };
+  }
+  return {
+    estado: 'ok',
+    motivo: 'ningun fichero de secretos versionado',
+    evidencias: [
+      {
+        descripcion:
+          `${ctx.versionados.length} ficheros versionados revisados (git ls-files): ninguno es un .env, una clave privada ` +
+          'ni un fichero de credenciales (.env.example y .env.sample no cuentan)',
+      },
+      ...silenciadas,
+    ],
+  };
+};
+
+// ---------------------------------------------------------------------
+// gitignore-env
+// ---------------------------------------------------------------------
+
+export const sondaGitignoreEnv: Sonda = (ctx) => {
+  const r = gitCrudo(['check-ignore', '-v', '--no-index', '.env'], ctx.cwd, { timeoutMs: 15_000 });
+  if (r.error !== undefined || (r.status !== 0 && r.status !== 1)) {
+    return {
+      estado: 'no-verificado',
+      motivo: `no se pudo ejecutar git check-ignore (${r.error?.message ?? `codigo ${String(r.status)}`})`,
+      evidencias: [],
+    };
+  }
+  if (r.status === 1) {
+    return {
+      estado: 'falla',
+      motivo: 'el .gitignore no cubre .env',
+      evidencias: [{ descripcion: 'git check-ignore --no-index .env: ninguna regla lo ignora', fichero: '.gitignore' }],
+    };
+  }
+  // Salida: `<fuente>:<linea>:<patron>\t<ruta>`. Solo vale una regla que viaja con el repo.
+  const m = /^(.*?):(\d+):(.*?)\t/.exec(r.stdout.toString('utf8').trim());
+  const fuente = m?.[1] ?? '';
+  const versionada = fuente !== '' && !path.isAbsolute(fuente) && !/[\\/]\.git[\\/]/.test(fuente) && !fuente.startsWith('.git/');
+  if (!versionada) {
+    return {
+      estado: 'falla',
+      motivo: 'solo lo cubre una regla local que no se versiona',
+      evidencias: [
+        {
+          descripcion: `la unica regla que ignora .env esta en "${fuente || 'desconocido'}" (excludesFile global o .git/info/exclude): no viaja con el repositorio`,
+        },
+      ],
+    };
+  }
+  return {
+    estado: 'ok',
+    motivo: '.env esta cubierto por el .gitignore',
+    evidencias: [
+      { descripcion: `la regla "${m?.[3] ?? ''}" ignora .env (git check-ignore -v --no-index .env)`, fichero: fuente, linea: Number(m?.[2]) },
+    ],
+  };
+};
+
+// ---------------------------------------------------------------------
+// lockfile
+// ---------------------------------------------------------------------
+
+const LOCKFILES: Readonly<Record<string, readonly string[]>> = {
+  node: ['package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'bun.lock'],
+  rust: ['Cargo.lock'],
+  python: ['poetry.lock', 'Pipfile.lock', 'uv.lock', 'pdm.lock', 'pylock.toml', 'requirements.txt'],
+  php: ['composer.lock'],
+  ruby: ['Gemfile.lock'],
+  go: ['go.sum'],
+};
+
+/** `.`, y cada carpeta padre hasta la raiz, de la mas cercana a la mas lejana. */
+function carpetaYAncestros(dir: string): string[] {
+  if (dir === '.') return ['.'];
+  const partes = dir.split('/');
+  const res: string[] = [];
+  for (let i = partes.length; i >= 1; i--) res.push(partes.slice(0, i).join('/'));
+  res.push('.');
+  return res;
+}
+
+const unir = (dir: string, nombre: string): string => (dir === '.' ? nombre : `${dir}/${nombre}`);
+
+export const sondaLockfile: Sonda = (ctx) => {
+  const versionados = new Set(ctx.versionados);
+  const presentes = new Set(ctx.presentes);
+  const ok: Evidencia[] = [];
+  const fallos: Evidencia[] = [];
+  let revisados = 0;
+  for (const tipo of ctx.tipos) {
+    const candidatos = LOCKFILES[tipo.id];
+    if (candidatos === undefined) continue;
+    for (const dir of tipo.rutas) {
+      revisados++;
+      const donde = carpetaYAncestros(dir);
+      const hallado = donde.flatMap((d) => candidatos.map((c) => unir(d, c))).find((r) => versionados.has(r));
+      if (hallado !== undefined) {
+        ok.push({ descripcion: `${tipo.nombre} en ${dir}: lockfile versionado`, fichero: hallado });
+        continue;
+      }
+      const sinVersionar = donde.flatMap((d) => candidatos.map((c) => unir(d, c))).find((r) => presentes.has(r));
+      fallos.push({
+        descripcion:
+          `${tipo.nombre} en ${dir}: no hay lockfile versionado (${candidatos.join(', ')})` +
+          (sinVersionar !== undefined ? `; existe ${sinVersionar} pero no esta versionado` : ''),
+        fichero: unir(dir, candidatos[0] as string),
+      });
+    }
+  }
+  if (fallos.length > 0) {
+    return { estado: 'falla', motivo: `${fallos.length} proyecto(s) sin lockfile versionado`, evidencias: [...fallos, ...ok] };
+  }
+  if (revisados === 0) {
+    return { estado: 'no-verificado', motivo: 'no se detecto ningun proyecto con gestor de dependencias que revisar', evidencias: [] };
+  }
+  return { estado: 'ok', motivo: 'lockfile versionado en todos los proyectos', evidencias: ok };
+};
+
+// ---------------------------------------------------------------------
+// secretos-historial
+// ---------------------------------------------------------------------
+
+interface HallazgoHistorial {
+  sha: string;
+  ruta: string;
+  patron: string;
+  linea: number;
+  muestra: string;
+}
+
+const BYTES_POR_LOTE = 32 * 1024 * 1024;
+
+function resumenRefs(ctx: ContextoDeploy): string | null {
+  const t = gitTexto(['for-each-ref', '--format=%(refname)'], ctx.cwd, { timeoutMs: 30_000 });
+  if (t === null) return null;
+  const refs = t.split(/\r?\n/).filter((r) => r !== '');
+  const cuenta = (p: string): number => refs.filter((r) => r.startsWith(p)).length;
+  const heads = cuenta('refs/heads/');
+  const remotas = cuenta('refs/remotes/');
+  const tags = cuenta('refs/tags/');
+  const otras = refs.length - heads - remotas - tags;
+  return (
+    `${heads} rama(s) local(es), ${remotas} remota(s), ${tags} etiqueta(s)` +
+    (otras > 0 ? `, ${otras} otra(s) ref(s) (stash, notas...)` : '') +
+    ' - git rev-list --all'
+  );
+}
+
+/** Complemento opcional: si gitleaks esta instalado, lo suma. Nunca cambia un OK por un FALLA sin hallazgo. */
+function complementoGitleaks(ctx: ContextoDeploy): { nota: Evidencia; hallazgos: Array<{ ruta: string; linea: number; commit: string; regla: string }> } {
+  const exe = localizarHerramienta('gitleaks', ctx.opciones.pathHerramientas);
+  if (exe === null) {
+    return { nota: { descripcion: 'gitleaks no esta instalado (opcional): el recorrido del historial usa solo los patrones propios' }, hallazgos: [] };
+  }
+  const version = versionDe(exe, ['version'], ctx.cwd, ctx.opciones.pathHerramientas);
+  const tmp = mkdtempSync(path.join(os.tmpdir(), 'taskctl-gitleaks-'));
+  try {
+    const informe = path.join(tmp, 'informe.json');
+    const e = ejecutarHerramienta(
+      exe,
+      ['detect', '--source', ctx.cwd, '--redact', '--no-banner', '--exit-code', '2', '--report-format', 'json', '--report-path', informe],
+      ctx.cwd,
+      ctx.opciones.pathHerramientas,
+      ctx.opciones.timeoutHerramientaMs
+    );
+    if (e.error !== null || (e.status !== 0 && e.status !== 2)) {
+      return { nota: { descripcion: `gitleaks ${version} no se pudo usar (${e.timeout ? 'timeout' : `codigo ${String(e.status)}`}): sin su resultado` }, hallazgos: [] };
+    }
+    if (e.status === 0) {
+      return { nota: { descripcion: `gitleaks ${version} (detect, historial completo): sin hallazgos` }, hallazgos: [] };
+    }
+    let lista: unknown;
+    try {
+      lista = JSON.parse(readFileSync(informe, 'utf8'));
+    } catch {
+      return { nota: { descripcion: `gitleaks ${version} detecto hallazgos pero su informe no se pudo leer: revisalo a mano` }, hallazgos: [] };
+    }
+    const hallazgos = (Array.isArray(lista) ? lista : [])
+      .map((x: unknown) => {
+        const o = typeof x === 'object' && x !== null ? (x as Record<string, unknown>) : {};
+        return {
+          ruta: String(o['File'] ?? '').replace(/\\/g, '/'),
+          linea: Number(o['StartLine'] ?? 0),
+          commit: String(o['Commit'] ?? ''),
+          regla: String(o['RuleID'] ?? 'desconocida'),
+        };
+      })
+      .filter((h) => h.ruta !== '');
+    return { nota: { descripcion: `gitleaks ${version} (detect, historial completo): ${hallazgos.length} hallazgo(s)` }, hallazgos };
+  } finally {
+    rmSync(tmp, { recursive: true, force: true });
+  }
+}
+
+interface Aparicion {
+  commit: string;
+  ruta: string;
+}
+
+/** Maximo de apariciones (commit + ruta) que se citan por blob con hallazgo. */
+const MAX_APARICIONES_POR_BLOB = 10;
+
+/**
+ * Los commits y rutas en que un blob entro en el repositorio (de mas antiguo a
+ * mas nuevo). `rev-list --objects` da cada blob UNA vez con una sola ruta; si el
+ * mismo contenido esta en dos ficheros, o se reintrodujo, hay que preguntarle a
+ * `git log --find-object` por cada aparicion. Solo se llama para los blobs con
+ * hallazgo. null = no se pudo preguntar.
+ */
+function aparicionesDeBlob(ctx: ContextoDeploy, sha: string): Aparicion[] | null {
+  const t = gitTexto(['log', '--all', '--no-renames', '--no-abbrev', '--raw', '--format=%H', `--find-object=${sha}`], ctx.cwd, {
+    timeoutMs: 60_000,
+  });
+  if (t === null) return null;
+  const apariciones: Aparicion[] = [];
+  const vistas = new Set<string>();
+  let commit = '';
+  for (const linea of t.split(/\r?\n/)) {
+    if (/^[0-9a-f]{40}$/.test(linea)) {
+      commit = linea;
+      continue;
+    }
+    const m = /^:\d+ \d+ [0-9a-f]+ ([0-9a-f]{40}) [AM]\t(.+)$/.exec(linea);
+    if (m === null || m[1] !== sha || commit === '') continue;
+    const clave = `${commit}\0${m[2] as string}`;
+    if (vistas.has(clave)) continue;
+    vistas.add(clave);
+    apariciones.push({ commit, ruta: m[2] as string });
+  }
+  return apariciones.reverse();
+}
+
+export const sondaSecretosHistorial: Sonda = (ctx) => {
+  const sinVerificar = (motivo: string): ResultadoSonda => ({ estado: 'no-verificado', motivo, evidencias: [] });
+  const cwd = ctx.cwd;
+
+  if (gitTexto(['rev-parse', '--verify', '--quiet', 'HEAD'], cwd, { timeoutMs: 15_000 }) === null) {
+    return {
+      estado: 'ok',
+      motivo: 'el repositorio no tiene commits: no hay historial que contenga secretos',
+      evidencias: [{ descripcion: 'git rev-parse --verify HEAD: sin commits' }],
+    };
+  }
+  const superficial = gitTexto(['rev-parse', '--is-shallow-repository'], cwd, { timeoutMs: 15_000 });
+  if (superficial === null) return sinVerificar('no se pudo saber si el clon es superficial (git rev-parse --is-shallow-repository fallo)');
+  if (superficial.trim() === 'true') {
+    return sinVerificar('el clon es superficial: el historial esta truncado y los secretos antiguos no se pueden ver. Haz git fetch --unshallow y repite');
+  }
+  const refs = resumenRefs(ctx);
+  if (refs === null) return sinVerificar('no se pudieron listar las referencias (git for-each-ref fallo)');
+
+  const inicio = Date.now();
+  const restante = (): number => ctx.opciones.timeoutHistorialMs - (Date.now() - inicio);
+
+  // 1. Todos los objetos alcanzables desde cualquier ref.
+  const objetos = gitCrudo(['rev-list', '--all', '--objects'], cwd, {
+    maxBuffer: 512 * 1024 * 1024,
+    timeoutMs: Math.max(1000, restante()),
+  });
+  if (objetos.error !== undefined || objetos.status !== 0) {
+    return sinVerificar(`git rev-list --all --objects no termino (${objetos.error?.message ?? `codigo ${String(objetos.status)}`}): historial sin recorrer`);
+  }
+  const rutaDe = new Map<string, string>();
+  const shas: string[] = [];
+  for (const linea of objetos.stdout.toString('utf8').split(/\r?\n/)) {
+    if (linea === '') continue;
+    const sp = linea.indexOf(' ');
+    const sha = sp === -1 ? linea : linea.slice(0, sp);
+    if (!/^[0-9a-f]{40}$/.test(sha)) continue;
+    shas.push(sha);
+    if (sp !== -1 && sp < linea.length - 1) rutaDe.set(sha, linea.slice(sp + 1));
+  }
+
+  // 2. Tipo y tamano de cada objeto: solo los blobs de texto de tamano razonable.
+  const tipos = gitCrudo(['cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'], cwd, {
+    input: `${shas.join('\n')}\n`,
+    maxBuffer: 512 * 1024 * 1024,
+    timeoutMs: Math.max(1000, restante()),
+  });
+  if (tipos.error !== undefined || tipos.status !== 0) {
+    return sinVerificar(`git cat-file --batch-check no termino (${tipos.error?.message ?? `codigo ${String(tipos.status)}`}): historial sin recorrer`);
+  }
+  const candidatos: Array<{ sha: string; ruta: string; tam: number }> = [];
+  let grandes = 0;
+  let enExcluidas = 0;
+  let totalBlobs = 0;
+  for (const linea of tipos.stdout.toString('utf8').split(/\r?\n/)) {
+    const m = /^([0-9a-f]{40}) blob (\d+)$/.exec(linea);
+    if (m === null) continue;
+    totalBlobs++;
+    const sha = m[1] as string;
+    const tam = Number(m[2]);
+    const ruta = rutaDe.get(sha) ?? '';
+    if (ruta !== '' && estaExcluido(ruta)) {
+      enExcluidas++;
+      continue;
+    }
+    if (tam === 0) continue;
+    if (tam > ctx.opciones.maxBytesFichero) {
+      grandes++;
+      continue;
+    }
+    candidatos.push({ sha, ruta, tam });
+  }
+
+  let cortado: string | null = null;
+  let aEscanear = candidatos;
+  if (candidatos.length > ctx.opciones.maxBlobsHistorial) {
+    aEscanear = candidatos.slice(0, ctx.opciones.maxBlobsHistorial);
+    cortado = `el historial tiene ${candidatos.length} ficheros distintos y el limite es ${ctx.opciones.maxBlobsHistorial}: se miraron ${aEscanear.length}`;
+  }
+
+  // 3. Contenido de los blobs, por lotes, buscando claves.
+  const hallazgos: HallazgoHistorial[] = [];
+  let binarios = 0;
+  let escaneados = 0;
+  for (let i = 0; i < aEscanear.length && cortado === null; ) {
+    if (restante() <= 0) {
+      cortado = `se agoto el tiempo (${Math.round(ctx.opciones.timeoutHistorialMs / 1000)} s): se miraron ${escaneados} de ${aEscanear.length} ficheros`;
+      break;
+    }
+    let bytes = 0;
+    const lote: typeof aEscanear = [];
+    while (i < aEscanear.length && (lote.length === 0 || bytes + (aEscanear[i] as { tam: number }).tam <= BYTES_POR_LOTE)) {
+      const c = aEscanear[i] as (typeof aEscanear)[number];
+      lote.push(c);
+      bytes += c.tam;
+      i++;
+    }
+    const r = gitCrudo(['cat-file', '--batch'], cwd, {
+      input: `${lote.map((c) => c.sha).join('\n')}\n`,
+      maxBuffer: bytes + lote.length * 128 + 1024 * 1024,
+      timeoutMs: Math.max(1000, restante()),
+    });
+    if (r.error !== undefined || r.status !== 0) {
+      cortado = `git cat-file --batch no termino (${r.error?.message ?? `codigo ${String(r.status)}`}): se miraron ${escaneados} de ${aEscanear.length} ficheros`;
+      break;
+    }
+    // Formato: `<sha> blob <tam>\n<contenido>\n`, repetido.
+    let pos = 0;
+    const buf = r.stdout;
+    for (const c of lote) {
+      const finLinea = buf.indexOf(0x0a, pos);
+      if (finLinea === -1) break;
+      const cabecera = buf.toString('utf8', pos, finLinea);
+      const m = /^([0-9a-f]{40}) blob (\d+)$/.exec(cabecera);
+      if (m === null) break;
+      const tam = Number(m[2]);
+      const datos = buf.subarray(finLinea + 1, finLinea + 1 + tam);
+      pos = finLinea + 1 + tam + 1;
+      escaneados++;
+      if (esBinario(datos)) {
+        binarios++;
+        continue;
+      }
+      for (const h of buscarSecretos(datos.toString('utf8'))) {
+        if (h.clase !== 'secreto') continue;
+        if (hallazgos.length < MAX_HALLAZGOS) hallazgos.push({ sha: c.sha, ruta: c.ruta, patron: h.patron, linea: h.linea, muestra: h.muestra });
+      }
+    }
+  }
+
+  // 4. En que commits y rutas aparecio cada blob con hallazgo (solo para esos).
+  const aparicionesDe = new Map<string, Aparicion[] | null>();
+  const fallos: Evidencia[] = [];
+  const silenciadas: Evidencia[] = [];
+  for (const h of hallazgos) {
+    if (!aparicionesDe.has(h.sha)) aparicionesDe.set(h.sha, aparicionesDeBlob(ctx, h.sha));
+    const todas = aparicionesDe.get(h.sha) ?? null;
+    const citadas: Array<{ commit?: string; ruta: string }> =
+      todas === null || todas.length === 0
+        ? [{ ruta: h.ruta === '' ? '(ruta desconocida)' : h.ruta }]
+        : todas.slice(0, MAX_APARICIONES_POR_BLOB);
+    const sinCitar = todas === null ? 0 : Math.max(0, todas.length - citadas.length);
+    for (const ap of citadas) {
+      const s = buscarSilencio(ctx, h.patron, ap.ruta, ap.commit ?? null);
+      if (s !== null) {
+        silenciadas.push(evidenciaSilenciada(s, h.patron, ap.ruta, h.linea, ap.commit));
+        continue;
+      }
+      const e: Evidencia = { descripcion: `clave secreta en el historial (patron ${h.patron})`, fichero: ap.ruta, linea: h.linea, muestra: h.muestra };
+      if (ap.commit !== undefined) e.commit = ap.commit;
+      else e.descripcion += '; no se pudo localizar el commit con git log --find-object';
+      if (sinCitar > 0) e.descripcion += `; el mismo contenido aparece en ${sinCitar} commit(s) mas`;
+      fallos.push(e);
+    }
+  }
+
+  // 5. Opcional: gitleaks.
+  const gl = complementoGitleaks(ctx);
+  for (const g of gl.hallazgos) {
+    const s = buscarSilencio(ctx, `gitleaks:${g.regla}`, g.ruta, g.commit === '' ? null : g.commit);
+    if (s !== null) silenciadas.push(evidenciaSilenciada(s, `gitleaks:${g.regla}`, g.ruta, g.linea, g.commit));
+    else {
+      const e: Evidencia = { descripcion: `hallazgo de gitleaks (regla ${g.regla})`, fichero: g.ruta, linea: g.linea };
+      if (g.commit !== '') e.commit = g.commit;
+      fallos.push(e);
+    }
+  }
+
+  const alcance: Evidencia[] = [
+    { descripcion: `refs recorridos: ${refs}` },
+    {
+      descripcion:
+        `${escaneados} ficheros distintos de texto o binarios leidos (de ${totalBlobs} en el historial); ` +
+        `${binarios} binarios y ${grandes} mayores de ${Math.round(ctx.opciones.maxBytesFichero / 1024)} KiB saltados, ` +
+        `${enExcluidas} en node_modules, vendor, target, dist o build excluidos; ${IDS_PATRON.length} patrones`,
+    },
+    gl.nota,
+  ];
+
+  if (fallos.length > 0) {
+    return {
+      estado: 'falla',
+      motivo:
+        `${fallos.length}${hallazgos.length >= MAX_HALLAZGOS ? '+' : ''} clave(s) secreta(s) en el historial de git` +
+        (cortado !== null ? ` (recorrido incompleto: ${cortado})` : ''),
+      evidencias: [...fallos, ...silenciadas, ...alcance],
+    };
+  }
+  if (cortado !== null) {
+    return {
+      estado: 'no-verificado',
+      motivo: `recorrido del historial incompleto: ${cortado}`,
+      evidencias: [...silenciadas, ...alcance],
+    };
+  }
+  return {
+    estado: 'ok',
+    motivo: 'ninguna clave secreta en el historial de git',
+    evidencias: [...silenciadas, ...alcance],
+  };
+};
+
+// ---------------------------------------------------------------------
+// dependencias
+// ---------------------------------------------------------------------
+
+interface Objetivo {
+  /** Texto para el usuario: `npm audit --omit=dev`. */
+  comando: string;
+  tipo: string;
+  dir: string;
+  /** Ejecutable a localizar. */
+  exe: string;
+  args: string[];
+  argsVersion: string[];
+  alcance: string;
+  interpretar: (stdout: string, status: number | null) => VeredictoAuditoria;
+}
+
+function objetivosDe(ctx: ContextoDeploy, versionDeYarn: (dir: string) => number | null): { objetivos: Objetivo[]; sinHerramienta: string[] } {
+  const objetivos: Objetivo[] = [];
+  const sinHerramienta: string[] = [];
+  const versionados = new Set(ctx.versionados);
+  const hay = (dir: string, nombre: string): boolean => versionados.has(unir(dir, nombre));
+  const MAX_DIRS = 5;
+  for (const tipo of ctx.tipos) {
+    const dirs = tipo.rutas.slice(0, MAX_DIRS);
+    if (tipo.rutas.length > MAX_DIRS) sinHerramienta.push(`${tipo.nombre}: solo se auditan las ${MAX_DIRS} primeras carpetas de ${tipo.rutas.length}`);
+    for (const dir of dirs) {
+      switch (tipo.id) {
+        case 'node':
+          if (hay(dir, 'pnpm-lock.yaml')) {
+            objetivos.push({ comando: 'pnpm audit --prod', tipo: tipo.nombre, dir, exe: 'pnpm', args: ['audit', '--prod', '--json'], argsVersion: ['--version'], alcance: 'solo dependencias de runtime (--prod)', interpretar: (o, s) => interpretarNpmAudit('pnpm', o, s) });
+          } else if (hay(dir, 'yarn.lock')) {
+            const mayor = versionDeYarn(dir);
+            if (mayor === 1) {
+              objetivos.push({ comando: 'yarn audit --groups dependencies', tipo: tipo.nombre, dir, exe: 'yarn', args: ['audit', '--groups', 'dependencies', '--json'], argsVersion: ['--version'], alcance: 'solo dependencias de runtime (--groups dependencies)', interpretar: (o) => interpretarYarnAudit(o) });
+            } else if (mayor === null) {
+              sinHerramienta.push(`falta yarn (${dir}): no se pudo auditar con yarn audit`);
+            } else {
+              sinHerramienta.push(`yarn ${mayor} (${dir}): el formato de yarn npm audit no esta soportado todavia`);
+            }
+          } else {
+            objetivos.push({ comando: 'npm audit --omit=dev', tipo: tipo.nombre, dir, exe: 'npm', args: ['audit', '--omit=dev', '--json'], argsVersion: ['--version'], alcance: 'solo dependencias de runtime (--omit=dev)', interpretar: (o, s) => interpretarNpmAudit('npm', o, s) });
+          }
+          break;
+        case 'rust':
+          objetivos.push({ comando: 'cargo audit', tipo: tipo.nombre, dir, exe: 'cargo-audit', args: ['audit', '--json'], argsVersion: ['--version'], alcance: 'Cargo.lock completo (cargo audit no separa las dependencias de desarrollo)', interpretar: interpretarCargoAudit });
+          break;
+        case 'python':
+          if (hay(dir, 'requirements.txt')) {
+            objetivos.push({ comando: 'pip-audit -r requirements.txt', tipo: tipo.nombre, dir, exe: 'pip-audit', args: ['-f', 'json', '-r', 'requirements.txt'], argsVersion: ['--version'], alcance: 'requirements.txt completo', interpretar: interpretarPipAudit });
+          } else {
+            sinHerramienta.push(`${tipo.nombre} (${dir}): no hay requirements.txt versionado que pip-audit pueda auditar`);
+          }
+          break;
+        case 'dotnet':
+          objetivos.push({ comando: 'dotnet list package --vulnerable', tipo: tipo.nombre, dir, exe: 'dotnet', args: ['list', 'package', '--vulnerable', '--include-transitive'], argsVersion: ['--version'], alcance: 'proyectos y dependencias transitivas (dotnet no separa las de desarrollo)', interpretar: interpretarDotnetVulnerable });
+          break;
+        case 'go':
+          objetivos.push({ comando: 'govulncheck ./...', tipo: tipo.nombre, dir, exe: 'govulncheck', args: ['./...'], argsVersion: ['-version'], alcance: 'codigo alcanzable desde el modulo', interpretar: interpretarGovulncheck });
+          break;
+        case 'java':
+          sinHerramienta.push(`${tipo.nombre} (${dir}): no hay herramienta de auditoria soportada para Maven ni Gradle`);
+          break;
+        case 'php':
+          sinHerramienta.push(`${tipo.nombre} (${dir}): no hay herramienta de auditoria soportada para Composer`);
+          break;
+        case 'ruby':
+          sinHerramienta.push(`${tipo.nombre} (${dir}): no hay herramienta de auditoria soportada para Bundler`);
+          break;
+        default:
+          break;
+      }
+    }
+  }
+  return { objetivos, sinHerramienta };
+}
+
+export const sondaDependencias: Sonda = (ctx) => {
+  const { pathHerramientas, timeoutHerramientaMs } = ctx.opciones;
+
+  const versionDeYarn = (dir: string): number | null => {
+    const exe = localizarHerramienta('yarn', pathHerramientas);
+    if (exe === null) return null;
+    const v = versionDe(exe, ['--version'], path.join(ctx.cwd, dir), pathHerramientas);
+    const m = /^(\d+)\./.exec(v);
+    return m === null ? null : Number(m[1]);
+  };
+  const { objetivos, sinHerramienta } = objetivosDe(ctx, versionDeYarn);
+
+  const evidencias: Evidencia[] = [];
+  const faltan: string[] = [...sinHerramienta];
+  const graves: string[] = [];
+  const limpios: string[] = [];
+
+  for (const o of objetivos) {
+    const exe = localizarHerramienta(o.exe, pathHerramientas);
+    if (exe === null) {
+      faltan.push(`falta ${o.exe} (${o.tipo}, ${o.dir})`);
+      continue;
+    }
+    const version = versionDe(exe, o.argsVersion, path.join(ctx.cwd, o.dir), pathHerramientas);
+    const cabecera = `${o.comando} [${o.exe} ${version}; alcance: ${o.alcance}; carpeta ${o.dir}]`;
+    const e = ejecutarHerramienta(exe, o.args, path.join(ctx.cwd, o.dir), pathHerramientas, timeoutHerramientaMs);
+    if (e.timeout) {
+      faltan.push(`${o.comando} (${o.dir}) no termino en ${Math.round(timeoutHerramientaMs / 1000)} s`);
+      continue;
+    }
+    if (!e.lanzada || e.error !== null) {
+      faltan.push(`${o.comando} (${o.dir}) no se pudo lanzar: ${e.error ?? 'error desconocido'}`);
+      continue;
+    }
+    const v = o.interpretar(e.stdout, e.status);
+    if (v.estado === 'no-verificado') {
+      faltan.push(`${o.comando} (${o.dir}): ${v.resumen}`);
+      continue;
+    }
+    const listaOtras = v.otras.length > 0 ? `; el resto, listado sin fallar: ${v.otras.join(', ')}` : '';
+    if (v.estado === 'falla') {
+      graves.push(`${o.comando} (${o.dir})`);
+      evidencias.push({ descripcion: `${cabecera}: ${v.resumen}. Graves: ${v.graves.join(', ')}${listaOtras}` });
+    } else {
+      limpios.push(`${o.comando} (${o.dir})`);
+      evidencias.push({ descripcion: `${cabecera}: ${v.resumen}${listaOtras}` });
+    }
+  }
+
+  if (graves.length > 0) {
+    return {
+      estado: 'falla',
+      motivo:
+        `vulnerabilidades altas o criticas de runtime segun: ${graves.join('; ')}` +
+        (faltan.length > 0 ? `. Ademas sin verificar: ${faltan.join('; ')}` : ''),
+      evidencias,
+    };
+  }
+  if (faltan.length > 0) {
+    return {
+      estado: 'no-verificado',
+      motivo: `falta para verificarlo: ${faltan.join('; ')}`,
+      evidencias,
+    };
+  }
+  if (limpios.length === 0) {
+    return { estado: 'no-verificado', motivo: 'no hay ninguna herramienta de auditoria aplicable a los tipos detectados', evidencias: [] };
+  }
+  return {
+    estado: 'ok',
+    motivo: `sin vulnerabilidades altas ni criticas en las dependencias de runtime (${limpios.join('; ')})`,
+    evidencias,
+  };
+};
+
+// ---------------------------------------------------------------------
+// Registro
+// ---------------------------------------------------------------------
+
+export const SONDAS: Readonly<Record<string, Sonda>> = {
+  'secretos-arbol': sondaSecretosArbol,
+  'secretos-historial': sondaSecretosHistorial,
+  'ficheros-secretos': sondaFicherosSecretos,
+  'gitignore-env': sondaGitignoreEnv,
+  lockfile: sondaLockfile,
+  dependencias: sondaDependencias,
+};
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
new file mode 100644
index 0000000..6209d11
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
@@ -0,0 +1,770 @@
+/**
+ * TASK-066: `taskctl doctor-deploy` contra repos Git temporales REALES (nunca
+ * mocks). Las herramientas externas de auditoria se controlan con un PATH vacio:
+ * asi la suite no depende de lo que haya instalado ni sale a la red, y de paso
+ * prueba que una herramienta ausente es NO VERIFICADO.
+ *
+ * Los interpretes de la salida de cada herramienta se prueban en
+ * test/core/doctor-deploy-auditoria.test.ts con muestras de su formato; contra
+ * la herramienta real no se prueban (necesitan red).
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { pathToFileURL } from 'node:url';
+import { realpathSync } from 'node:fs';
+import { spawnSync } from 'node:child_process';
+import { main } from '../../src/cli.js';
+import {
+  runDoctorDeployCommand,
+  DoctorDeployCommandError,
+  type DoctorDeployResult,
+} from '../../src/commands/doctor-deploy.js';
+import { DoctorDeployCatalogoError, cargarCatalogoDeploy } from '../../src/core/doctor-deploy-catalogo.js';
+import type { InformeDeploy, ResultadoPunto } from '../../src/core/doctor-deploy.js';
+import { motivoFicheroSecreto } from '../../src/fs/sondas-deploy.js';
+
+const TOTAL_PUNTOS = cargarCatalogoDeploy().puntos.length;
+
+const AWS = 'AKIA' + 'ABCDEFGHIJKLMNOP';
+const STRIPE = 'sk_live_' + 'Zq81xKd0TvR4mNb7YcW2pLfH';
+const b64url = (o: unknown): string => Buffer.from(JSON.stringify(o)).toString('base64url');
+const jwt = (payload: unknown): string => `${b64url({ alg: 'HS256' })}.${b64url(payload)}.firmaFirmaFirmaFirma`;
+
+function git(args: string[], cwd: string): string {
+  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(r.status, 0, `git ${args.join(' ')} fallo: ${r.stderr}`);
+  return r.stdout.trim();
+}
+
+async function escribir(raiz: string, archivos: Record<string, string>): Promise<void> {
+  for (const [rel, contenido] of Object.entries(archivos)) {
+    const abs = path.join(raiz, rel);
+    await mkdir(path.dirname(abs), { recursive: true });
+    await writeFile(abs, contenido, 'utf8');
+  }
+}
+
+async function commit(raiz: string, mensaje: string): Promise<string> {
+  git(['add', '-A'], raiz);
+  git(['commit', '-q', '-m', mensaje], raiz);
+  return git(['rev-parse', 'HEAD'], raiz);
+}
+
+const NODE: Record<string, string> = {
+  'package.json': '{"name":"app","version":"1.0.0","dependencies":{}}\n',
+  'package-lock.json': '{"name":"app","lockfileVersion":3}\n',
+  '.gitignore': 'node_modules/\n.env\n',
+  'index.js': 'console.log("hola");\n',
+};
+const RUST: Record<string, string> = {
+  'Cargo.toml': '[package]\nname = "app"\nversion = "0.1.0"\nedition = "2021"\n',
+  'Cargo.lock': '# lock\nversion = 3\n',
+  '.gitignore': 'target/\n.env\n',
+  'src/main.rs': 'fn main() { println!("hola"); }\n',
+};
+const PYTHON: Record<string, string> = {
+  'pyproject.toml': '[project]\nname = "app"\nversion = "0.1.0"\n',
+  'requirements.txt': 'flask==3.0.0\n',
+  '.gitignore': '__pycache__/\n.env\n',
+  'app.py': 'print("hola")\n',
+};
+
+/** Repo Git temporal con los ficheros dados, un commit, y un PATH de herramientas vacio. */
+async function conRepo(
+  archivos: Record<string, string>,
+  fn: (raiz: string, opciones: { pathHerramientas: string }) => Promise<void>
+): Promise<void> {
+  const raiz = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-'));
+  const vacio = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-path-'));
+  try {
+    git(['init', '-q', '-b', 'main'], raiz);
+    git(['config', 'user.email', 'test@example.com'], raiz);
+    git(['config', 'user.name', 'Test'], raiz);
+    await escribir(raiz, archivos);
+    await commit(raiz, 'inicial');
+    await fn(raiz, { pathHerramientas: vacio });
+  } finally {
+    await rm(raiz, { recursive: true, force: true });
+    await rm(vacio, { recursive: true, force: true });
+  }
+}
+
+function ejecutar(
+  raiz: string,
+  opciones: { pathHerramientas: string; [k: string]: unknown },
+  args: string[] = ['--json'],
+  ahora?: Date
+): DoctorDeployResult {
+  return runDoctorDeployCommand(args, {
+    repoCwd: raiz,
+    opciones,
+    ...(ahora === undefined ? {} : { ahora: () => ahora }),
+  });
+}
+
+function punto(informe: InformeDeploy, id: string): ResultadoPunto {
+  const p = informe.puntos.find((x) => x.id === id);
+  assert.ok(p !== undefined, `no hay punto ${id}`);
+  return p;
+}
+
+/** Todas las subcadenas de 8 o mas caracteres de `secreto` (basta con las de 8: las largas las contienen). */
+function ventanas(secreto: string): string[] {
+  const v: string[] = [];
+  for (let i = 0; i + 8 <= secreto.length; i++) v.push(secreto.slice(i, i + 8));
+  return v;
+}
+
+function assertSinSecreto(texto: string, secreto: string, canal: string): void {
+  for (const v of ventanas(secreto)) {
+    assert.ok(!texto.includes(v), `el canal "${canal}" contiene la subcadena "${v}" del secreto`);
+  }
+}
+
+/** Propiedades que valen para CUALQUIER ejecucion. */
+function assertInvariantes(informe: InformeDeploy): void {
+  assert.equal(informe.puntos.length, TOTAL_PUNTOS);
+  for (const p of informe.puntos) {
+    if (p.estado === 'ok') assert.ok(p.evidencias.length > 0, `${p.id}: OK sin evidencia`);
+    if (p.estado === 'falla') assert.ok(p.evidencias.length > 0 && p.arreglo.length > 0, `${p.id}: FALLA sin evidencia o sin arreglo`);
+    if (p.estado === 'no-verificado' || p.estado === 'no-aplica') assert.ok(p.motivo.trim().length > 5, `${p.id}: ${p.estado} sin motivo`);
+    if (p.metodo === 'juicio' && !p.desactivado) assert.notEqual(p.estado, 'ok', `${p.id}: un punto de juicio nunca es OK`);
+  }
+}
+
+// ---------------------------------------------------------------------
+// Repos limpios: Node, Rust y Python
+// ---------------------------------------------------------------------
+
+const DETERMINISTAS_PROPIOS = [
+  'secretos-en-arbol',
+  'secretos-en-historial',
+  'ficheros-secretos-versionados',
+  'gitignore-cubre-env',
+  'lockfile-versionado',
+];
+
+for (const [nombre, archivos, tipoId] of [
+  ['Node', NODE, 'node'],
+  ['Rust', RUST, 'rust'],
+  ['Python', PYTHON, 'python'],
+] as const) {
+  test(`repo limpio ${nombre}: tipo visible, cero FALLA, salida 0, deterministas propios en OK, juicio NO VERIFICADO`, async () => {
+    await conRepo(archivos, async (raiz, opciones) => {
+      const r = ejecutar(raiz, opciones);
+      const informe = JSON.parse(r.salida) as InformeDeploy & { codigo: number; resumen: { falla: number; total: number } };
+      assertInvariantes(informe);
+      assert.ok(informe.tipos.some((t) => t.id === tipoId), `no detecta ${tipoId}`);
+      assert.equal(informe.resumen.falla, 0, informe.puntos.filter((p) => p.estado === 'falla').map((p) => p.id).join(', '));
+      assert.equal(r.codigo, 0);
+      assert.equal(informe.codigo, 0);
+      for (const id of DETERMINISTAS_PROPIOS) {
+        const p = punto(informe, id);
+        assert.equal(p.estado, 'ok', `${id}: ${p.motivo}`);
+        assert.ok(p.evidencias.length > 0);
+      }
+      for (const p of informe.puntos.filter((x) => x.metodo === 'juicio' && x.estado !== 'no-aplica')) {
+        assert.equal(p.estado, 'no-verificado', p.id);
+        assert.match(p.motivo, /falta la revision con juicio/);
+      }
+      // Sin herramientas en el PATH: la auditoria de dependencias es NO VERIFICADO diciendo que falta.
+      const dep = punto(informe, 'dependencias-vulnerables');
+      assert.equal(dep.estado, 'no-verificado');
+      assert.match(dep.motivo, /falta (npm|cargo-audit|pip-audit)/);
+      // Un punto de otro tipo sale NO APLICA con motivo.
+      const docker = punto(informe, 'dockerfile-sin-user');
+      assert.equal(docker.estado, 'no-aplica');
+      assert.match(docker.motivo, /docker/);
+      assert.match(docker.motivo, new RegExp(tipoId));
+    });
+  });
+}
+
+test('NO APLICA: el cliente de la base de datos es de frontend/node, y en Rust sale NO APLICA con el motivo', async () => {
+  await conRepo(RUST, async (raiz, opciones) => {
+    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    const p = punto(informe, 'clave-publica-en-cliente-db');
+    assert.equal(p.estado, 'no-aplica');
+    assert.match(p.motivo, /frontend o node/);
+    assert.match(p.motivo, /detectado: rust/);
+  });
+});
+
+test('el texto muestra el tipo detectado y el resumen «N de M sin verificar»', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    const r = ejecutar(raiz, opciones, []);
+    assert.equal(r.json, false);
+    assert.match(r.salida, /Tipos detectados: Node\.js \(\.\)/);
+    const m = /(\d+) de (\d+) sin verificar/.exec(r.salida);
+    assert.ok(m !== null);
+    assert.equal(Number(m[2]), TOTAL_PUNTOS);
+    assert.ok(Number(m[1]) > 0);
+    assert.match(r.salida, /Sin FALLA no es «listo para publicar»/);
+    assert.match(r.salida, /Salida 0\./);
+  });
+});
+
+test('sin ningun fichero marcador: se dice, y los puntos de «todos» siguen corriendo', async () => {
+  await conRepo({ 'README.md': '# nada\n', '.gitignore': '.env\n' }, async (raiz, opciones) => {
+    const r = ejecutar(raiz, opciones);
+    const informe = JSON.parse(r.salida) as InformeDeploy;
+    assert.deepEqual(informe.tipos, []);
+    assert.ok(informe.avisos.some((a) => /ningun tipo de aplicacion/.test(a)));
+    assert.equal(punto(informe, 'ficheros-secretos-versionados').estado, 'ok');
+    assert.equal(punto(informe, 'secretos-en-arbol').estado, 'ok');
+    assertInvariantes(informe);
+  });
+});
+
+test('tipos: Java, .NET, Go, PHP, Ruby, Docker y frontend se detectan por sus marcadores', async () => {
+  await conRepo(
+    {
+      'pom.xml': '<project/>\n',
+      'App.csproj': '<Project/>\n',
+      'go.mod': 'module x\n',
+      'composer.json': '{}\n',
+      'Gemfile': "source 'https://rubygems.org'\n",
+      'Dockerfile': 'FROM scratch\n',
+      'web/vite.config.ts': 'export default {}\n',
+      'pnpm-lock.yaml': 'lockfileVersion: 9\n',
+      'a/b/c/d/package.json': '{}\n', // demasiado profundo: no cuenta
+    },
+    async (raiz, opciones) => {
+      const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+      const ids = informe.tipos.map((t) => t.id);
+      for (const id of ['java', 'maven', 'dotnet', 'go', 'php', 'ruby', 'docker', 'frontend', 'pnpm']) {
+        assert.ok(ids.includes(id), `no detecta ${id}: ${ids.join(',')}`);
+      }
+      assert.ok(!ids.includes('node'), 'package.json a mas de 3 carpetas no cuenta');
+      assert.deepEqual(informe.tipos.find((t) => t.id === 'frontend')?.rutas, ['web']);
+    }
+  );
+});
+
+test('node_modules, vendor, target, dist y build no se escanean ni detectan', async () => {
+  await conRepo(
+    {
+      ...NODE,
+      'node_modules/dep/package.json': '{}\n',
+      'node_modules/dep/leak.js': `const k = "${STRIPE}";\n`,
+      'vendor/x/Gemfile': '\n',
+      'dist/app.js': `const k = "${AWS}";\n`,
+      'target/debug/x.env': `K=${STRIPE}\n`,
+    },
+    async (raiz, opciones) => {
+      const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+      assert.equal(punto(informe, 'secretos-en-arbol').estado, 'ok');
+      assert.ok(!informe.tipos.some((t) => t.id === 'ruby'));
+      // Tampoco en el historial.
+      assert.equal(punto(informe, 'secretos-en-historial').estado, 'ok');
+    }
+  );
+});
+
+// ---------------------------------------------------------------------
+// Secretos: arbol, historial, enmascarado
+// ---------------------------------------------------------------------
+
+test('secreto plantado en el arbol: FALLA con fichero y linea, enmascarado, y el arreglo del catalogo', async () => {
+  await conRepo(
+    { ...NODE, 'src/config.js': `// config\nmodule.exports = {\n  stripe: "${STRIPE}",\n};\n` },
+    async (raiz, opciones) => {
+      const r = ejecutar(raiz, opciones);
+      const informe = JSON.parse(r.salida) as InformeDeploy;
+      const p = punto(informe, 'secretos-en-arbol');
+      assert.equal(p.estado, 'falla');
+      assert.equal(p.evidencias[0]?.fichero, 'src/config.js');
+      assert.equal(p.evidencias[0]?.linea, 3);
+      assert.match(p.evidencias[0]?.muestra ?? '', /^sk_l\*\*\*\* \(32 caracteres\)$/);
+      assert.ok(p.arreglo.includes('rotala primero'));
+      assert.equal(r.codigo, 1);
+      assertInvariantes(informe);
+    }
+  );
+});
+
+test('secreto plantado SOLO en el historial: FALLA del historial con el hash del commit; el arbol y los ficheros, OK', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    await escribir(raiz, { '.env': `AWS_ACCESS_KEY_ID=${AWS}\nSTRIPE_KEY=${STRIPE}\n` });
+    git(['add', '-f', '.env'], raiz); // el .gitignore lo ignora: se fuerza, como pasa en la vida real
+    const hashConSecreto = await commit(raiz, 'anade env por error');
+    git(['rm', '-q', '.env'], raiz);
+    await commit(raiz, 'borra el env');
+
+    const r = ejecutar(raiz, opciones);
+    const informe = JSON.parse(r.salida) as InformeDeploy;
+    assertInvariantes(informe);
+
+    const h = punto(informe, 'secretos-en-historial');
+    assert.equal(h.estado, 'falla', h.motivo);
+    const commits = h.evidencias.filter((e) => e.muestra !== undefined).map((e) => e.commit);
+    assert.deepEqual(commits, [hashConSecreto, hashConSecreto], 'las dos claves apuntan al commit que las introdujo');
+    assert.ok(h.evidencias.some((e) => e.fichero === '.env' && e.linea === 1));
+    assert.ok(h.evidencias.some((e) => e.fichero === '.env' && e.linea === 2));
+    assert.ok(h.evidencias.some((e) => /refs recorridos: 1 rama\(s\) local\(es\)/.test(e.descripcion)), 'dice que refs se miraron');
+    assert.ok(h.arreglo.indexOf('Rota la clave primero') < h.arreglo.indexOf('reescribe el historial'));
+
+    // Mutacion que esto mata: buscar solo en el arbol.
+    assert.equal(punto(informe, 'secretos-en-arbol').estado, 'ok');
+    assert.equal(punto(informe, 'ficheros-secretos-versionados').estado, 'ok');
+    assert.equal(r.codigo, 1);
+
+    // El texto tambien lo muestra, con el hash.
+    const texto = ejecutar(raiz, opciones, []);
+    assert.match(texto.salida, /\[FALLA\] secretos-en-historial/);
+    assert.ok(texto.salida.includes(hashConSecreto));
+    assert.equal(texto.codigo, 1);
+  });
+});
+
+test('enmascarado: ninguna subcadena de 8+ caracteres del secreto sale por stdout, JSON ni informe', async () => {
+  await conRepo(
+    { ...NODE, 'src/config.js': `const k = "${STRIPE}";\n` },
+    async (raiz, opciones) => {
+      await escribir(raiz, { '.env': `AWS=${AWS}\n` });
+      git(['add', '-f', '.env'], raiz);
+      await commit(raiz, 'env');
+
+      const texto = ejecutar(raiz, opciones, ['--escribir']);
+      const json = ejecutar(raiz, opciones, ['--json']);
+      const informe = await readFile(texto.rutaInforme as string, 'utf8');
+
+      for (const secreto of [STRIPE, AWS]) {
+        assertSinSecreto(texto.salida, secreto, 'stdout');
+        assertSinSecreto(json.salida, secreto, 'json');
+        assertSinSecreto(informe, secreto, 'informe');
+        assertSinSecreto(texto.mensajeEscritura, secreto, 'mensaje');
+      }
+      // Y aun asi lo detecta: no es que no lo vea.
+      assert.equal(punto(JSON.parse(json.salida) as InformeDeploy, 'secretos-en-arbol').estado, 'falla');
+      assert.equal(punto(JSON.parse(json.salida) as InformeDeploy, 'ficheros-secretos-versionados').estado, 'falla');
+    }
+  );
+});
+
+test('segunda red: un secreto que se colara en un nombre de fichero tambien sale enmascarado', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    // El nombre del fichero lleva una clave: la evidencia cita el nombre y la segunda red lo tapa.
+    await escribir(raiz, { [`${STRIPE}.txt`]: `valor ${STRIPE}\n` });
+    await commit(raiz, 'fichero con la clave en el nombre');
+    const r = ejecutar(raiz, opciones);
+    const j = ejecutar(raiz, opciones, ['--json']);
+    assertSinSecreto(r.salida, STRIPE, 'stdout');
+    assertSinSecreto(j.salida, STRIPE, 'json');
+    JSON.parse(j.salida);
+  });
+});
+
+test('claves de ejemplo, de prueba y publicas a proposito no fallan; service_role si', async () => {
+  await conRepo(
+    {
+      ...NODE,
+      'docs/ejemplo.md': 'AKIAIOSFODNN7EXAMPLE\nsk_test_4eC39HqLyjWDarjtT1zdp7dc\n',
+      'src/cliente.js': `const anon = "${jwt({ role: 'anon' })}";\nconst fb = "AIza${'SyA-1234567890abcdefghijklmnopqrstu'}";\n`,
+    },
+    async (raiz, opciones) => {
+      const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+      for (const id of ['secretos-en-arbol', 'secretos-en-historial']) {
+        assert.equal(punto(informe, id).estado, 'ok', `${id}: ${punto(informe, id).motivo}`);
+      }
+      const conPublicas = punto(informe, 'secretos-en-arbol').evidencias.map((e) => e.descripcion).join('\n');
+      assert.match(conPublicas, /2 claves publicas a proposito/);
+      assert.match(conPublicas, /2 de ejemplo o de prueba/);
+
+      await escribir(raiz, { 'src/servidor.js': `const s = "${jwt({ role: 'service_role' })}";\n` });
+      await commit(raiz, 'service role');
+      const mal = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+      const p = punto(mal, 'secretos-en-arbol');
+      assert.equal(p.estado, 'falla');
+      assert.match(p.evidencias[0]?.descripcion ?? '', /supabase-service-role/);
+    }
+  );
+});
+
+// ---------------------------------------------------------------------
+// Ficheros de secretos, .gitignore, lockfile
+// ---------------------------------------------------------------------
+
+test('motivoFicheroSecreto: .env y claves si; .env.example, .env.sample y .pub no', () => {
+  for (const r of ['.env', 'api/.env', '.env.production', '.env.local', 'id_rsa', 'ssh/id_ed25519', 'cert.p12', 'app.keystore', 'credentials.json', 'home/.aws/credentials', '.htpasswd']) {
+    assert.notEqual(motivoFicheroSecreto(r), null, r);
+  }
+  for (const r of ['.env.example', '.env.sample', '.env.template', '.env.vault', 'id_rsa.pub', 'src/env.ts', 'README.md', 'cert.pem']) {
+    assert.equal(motivoFicheroSecreto(r), null, r);
+  }
+});
+
+test('.env versionado: FALLA; un .env.example sin valores no cuenta', async () => {
+  await conRepo({ ...NODE, '.env.example': 'API_KEY=\nDB_URL=\n' }, async (raiz, opciones) => {
+    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    assert.equal(punto(informe, 'ficheros-secretos-versionados').estado, 'ok');
+    assert.equal(punto(informe, 'secretos-en-arbol').estado, 'ok');
+
+    await escribir(raiz, { '.env': 'API_KEY=abc\n' });
+    git(['add', '-f', '.env'], raiz);
+    await commit(raiz, 'env');
+    const mal = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    const p = punto(mal, 'ficheros-secretos-versionados');
+    assert.equal(p.estado, 'falla');
+    assert.equal(p.evidencias[0]?.fichero, '.env');
+  });
+});
+
+test('un .env.example con una clave real SI falla (por el escaneo del arbol)', async () => {
+  await conRepo({ ...NODE, '.env.example': `STRIPE_KEY=${STRIPE}\n` }, async (raiz, opciones) => {
+    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    assert.equal(punto(informe, 'secretos-en-arbol').estado, 'falla');
+    assert.equal(punto(informe, 'secretos-en-arbol').evidencias[0]?.fichero, '.env.example');
+  });
+});
+
+test('.gitignore que no cubre .env: FALLA con evidencia', async () => {
+  await conRepo({ ...NODE, '.gitignore': 'node_modules/\n' }, async (raiz, opciones) => {
+    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    const p = punto(informe, 'gitignore-cubre-env');
+    assert.equal(p.estado, 'falla');
+    assert.ok(p.evidencias.length > 0);
+    await writeFile(path.join(raiz, '.gitignore'), 'node_modules/\n.env*\n!.env.example\n', 'utf8');
+    const bien = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    const p2 = punto(bien, 'gitignore-cubre-env');
+    assert.equal(p2.estado, 'ok');
+    assert.equal(p2.evidencias[0]?.fichero, '.gitignore');
+  });
+});
+
+test('lockfile: sin el, FALLA diciendo cual falta; sin versionar, lo dice', async () => {
+  const { 'package-lock.json': _lock, ...sinLock } = NODE;
+  await conRepo(sinLock, async (raiz, opciones) => {
+    const p = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'lockfile-versionado');
+    assert.equal(p.estado, 'falla');
+    assert.match(p.evidencias[0]?.descripcion ?? '', /package-lock\.json/);
+    // Existe pero sin versionar.
+    await escribir(raiz, { 'package-lock.json': '{}\n' });
+    const q = punto(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy, 'lockfile-versionado');
+    assert.equal(q.estado, 'falla');
+    assert.match(q.evidencias[0]?.descripcion ?? '', /existe package-lock\.json pero no esta versionado/);
+  });
+});
+
+test('lockfile en un monorepo: el de la raiz vale para los paquetes', async () => {
+  await conRepo(
+    { 'package.json': '{}\n', 'package-lock.json': '{}\n', 'packages/a/package.json': '{}\n', '.gitignore': '.env\n' },
+    async (raiz, opciones) => {
+      const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+      assert.equal(punto(informe, 'lockfile-versionado').estado, 'ok');
+      assert.deepEqual(informe.tipos.find((t) => t.id === 'node')?.rutas, ['.', 'packages/a']);
+    }
+  );
+});
+
+// ---------------------------------------------------------------------
+// Historial: limites, clon superficial
+// ---------------------------------------------------------------------
+
+test('clon superficial: el historial sale NO VERIFICADO (truncado), nunca OK', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    await escribir(raiz, { 'otro.js': '1\n' });
+    await commit(raiz, 'segundo');
+    const destino = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-clon-'));
+    try {
+      git(['clone', '-q', '--depth', '1', pathToFileURL(raiz).href, path.join(destino, 'c')], destino);
+      const informe = JSON.parse(ejecutar(path.join(destino, 'c'), opciones).salida) as InformeDeploy;
+      const p = punto(informe, 'secretos-en-historial');
+      assert.equal(p.estado, 'no-verificado');
+      assert.match(p.motivo, /superficial/);
+      assert.match(p.motivo, /unshallow/);
+    } finally {
+      await rm(destino, { recursive: true, force: true });
+    }
+  });
+});
+
+test('desbordamiento de limites: pasarse de blobs o de tiempo es NO VERIFICADO, nunca OK ni excepcion', async () => {
+  await conRepo({ ...NODE, 'a.txt': 'a\n', 'b.txt': 'b\n', 'c.txt': 'c\n' }, async (raiz, opciones) => {
+    const pocos = JSON.parse(ejecutar(raiz, { ...opciones, maxBlobsHistorial: 1 }).salida) as InformeDeploy;
+    const p = punto(pocos, 'secretos-en-historial');
+    assert.equal(p.estado, 'no-verificado');
+    assert.match(p.motivo, /incompleto/);
+    const sinTiempo = JSON.parse(ejecutar(raiz, { ...opciones, timeoutHistorialMs: 0 }).salida) as InformeDeploy;
+    const q = punto(sinTiempo, 'secretos-en-historial');
+    assert.equal(q.estado, 'no-verificado');
+    assert.match(q.motivo, /tiempo/);
+  });
+});
+
+test('un secreto hallado con el recorrido cortado sigue siendo FALLA (un hallazgo no se pierde por el limite)', async () => {
+  await conRepo({ 'a.txt': `k=${STRIPE}\n`, '.gitignore': '.env\n' }, async (raiz, opciones) => {
+    await escribir(raiz, { 'b.txt': 'b\n', 'c.txt': 'c\n', 'd.txt': 'd\n' });
+    await commit(raiz, 'mas');
+    const informe = JSON.parse(ejecutar(raiz, { ...opciones, maxBlobsHistorial: 100 }).salida) as InformeDeploy;
+    assert.equal(punto(informe, 'secretos-en-historial').estado, 'falla');
+  });
+});
+
+test('repositorio sin commits: el historial no tiene nada que revisar y lo dice', async () => {
+  const raiz = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-vacio-'));
+  const vacio = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-path-'));
+  try {
+    git(['init', '-q', '-b', 'main'], raiz);
+    await escribir(raiz, { 'README.md': '# x\n', '.gitignore': '.env\n' });
+    const r = ejecutar(raiz, { pathHerramientas: vacio });
+    const informe = JSON.parse(r.salida) as InformeDeploy;
+    assert.equal(informe.commit, null);
+    const p = punto(informe, 'secretos-en-historial');
+    assert.equal(p.estado, 'ok');
+    assert.ok(p.evidencias.length > 0);
+    assertInvariantes(informe);
+  } finally {
+    await rm(raiz, { recursive: true, force: true });
+    await rm(vacio, { recursive: true, force: true });
+  }
+});
+
+// ---------------------------------------------------------------------
+// Capa del proyecto
+// ---------------------------------------------------------------------
+
+test('capa: desactivar sin motivo aborta; con motivo el punto sale NO APLICA marcado', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    await escribir(raiz, { '.taskcode/doctor-deploy.yml': 'desactivar_1_id: lockfile-versionado\n' });
+    assert.throws(
+      () => ejecutar(raiz, opciones),
+      (e: unknown) => e instanceof DoctorDeployCatalogoError && /exige "desactivar_1_motivo"/.test(e.message)
+    );
+    await escribir(raiz, {
+      '.taskcode/doctor-deploy.yml':
+        'desactivar_1_id: lockfile-versionado\ndesactivar_1_motivo: Es una libreria: el lockfile no se versiona\ndesactivar_2_id: no-existe\ndesactivar_2_motivo: x\n',
+    });
+    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    const p = punto(informe, 'lockfile-versionado');
+    assert.equal(p.estado, 'no-aplica');
+    assert.equal(p.desactivado, true);
+    assert.match(p.motivo, /libreria/);
+    assert.ok(informe.avisos.some((a) => /"no-existe", que no existe/.test(a)));
+    assertInvariantes(informe);
+    // El texto lo marca.
+    assert.match(ejecutar(raiz, opciones, []).salida, /\[NO APLICA\] lockfile-versionado .*DESACTIVADO/);
+  });
+});
+
+test('capa: un punto anadido de juicio sale NO VERIFICADO; uno con sonda registrada se ejecuta; un id repetido aborta', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    await escribir(raiz, {
+      '.taskcode/doctor-deploy.yml':
+        'punto_1_id: revisar-pii\npunto_1_severidad: alta\npunto_1_tipos: [todos]\npunto_1_metodo: juicio\npunto_1_arreglo: Quita los datos personales de los logs\npunto_1_descripcion: Los logs no llevan datos personales de clientes\n' +
+        'punto_2_id: lock-propio\npunto_2_severidad: media\npunto_2_tipos: [node]\npunto_2_metodo: determinista\npunto_2_sonda: lockfile\npunto_2_arreglo: Versiona el lockfile\npunto_2_descripcion: Lockfile propio del proyecto\n',
+    });
+    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    assert.equal(informe.puntos.length, TOTAL_PUNTOS + 2);
+    assert.equal(punto(informe, 'revisar-pii').estado, 'no-verificado');
+    assert.equal(punto(informe, 'lock-propio').estado, 'ok');
+
+    await escribir(raiz, {
+      '.taskcode/doctor-deploy.yml': 'punto_1_id: lockfile-versionado\npunto_1_severidad: alta\npunto_1_tipos: [todos]\npunto_1_metodo: juicio\npunto_1_arreglo: A\npunto_1_descripcion: D\n',
+    });
+    assert.throws(() => ejecutar(raiz, opciones), (e: unknown) => e instanceof DoctorDeployCatalogoError && /ya existe en el catalogo del plugin/.test(e.message));
+  });
+});
+
+test('capa: silenciar un hallazgo concreto lo saca de la cuenta, con su motivo en la evidencia; otro igual no silenciado sigue fallando', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    await escribir(raiz, { 'viejo/prod.env': `K=${STRIPE}\n`, 'nuevo/prod.env': `K=${STRIPE}\n` });
+    git(['add', '-f', '.'], raiz);
+    const hash = await commit(raiz, 'envs');
+    git(['rm', '-q', '-r', 'viejo', 'nuevo'], raiz);
+    await commit(raiz, 'quita los envs');
+
+    const sin = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    assert.equal(punto(sin, 'secretos-en-historial').estado, 'falla');
+    assert.equal(punto(sin, 'secretos-en-historial').evidencias.filter((e) => e.muestra !== undefined).length, 2);
+
+    await escribir(raiz, {
+      '.taskcode/doctor-deploy.yml':
+        `silenciar_1_patron: stripe-live\nsilenciar_1_fichero: viejo/prod.env\nsilenciar_1_commit: "${hash.slice(0, 10)}"\n` +
+        'silenciar_1_motivo: Clave rotada el 2026-10-01\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n' +
+        'silenciar_2_patron: stripe-live\nsilenciar_2_fichero: no/existe.env\nsilenciar_2_motivo: Por si acaso\nsilenciar_2_quien: carlos\nsilenciar_2_fecha: 2026-10-27\n',
+    });
+    const r = ejecutar(raiz, opciones);
+    const con = JSON.parse(r.salida) as InformeDeploy;
+    const p = punto(con, 'secretos-en-historial');
+    assert.equal(p.estado, 'falla', 'el otro .env sigue fallando');
+    assert.equal(p.evidencias.filter((e) => e.muestra !== undefined).length, 1);
+    assert.equal(p.evidencias.find((e) => e.muestra !== undefined)?.fichero, 'nuevo/prod.env');
+    const silenciada = p.evidencias.find((e) => e.descripcion.startsWith('SILENCIADO'));
+    assert.ok(silenciada !== undefined);
+    assert.match(silenciada.descripcion, /Clave rotada el 2026-10-01 - carlos, 2026-10-27/);
+    assert.equal(silenciada.fichero, 'viejo/prod.env');
+    // El silencio que no coincide con nada se avisa.
+    assert.ok(con.avisos.some((a) => /silenciar_2 .* no coincide con ningun hallazgo/.test(a)));
+
+    // Silenciando tambien el segundo, el punto queda en OK y la salida es 0.
+    await writeFile(
+      path.join(raiz, '.taskcode/doctor-deploy.yml'),
+      'silenciar_1_patron: stripe-live\nsilenciar_1_fichero: viejo/prod.env\nsilenciar_1_motivo: Rotada\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n' +
+        'silenciar_2_patron: stripe-live\nsilenciar_2_fichero: nuevo/prod.env\nsilenciar_2_motivo: Rotada\nsilenciar_2_quien: carlos\nsilenciar_2_fecha: 2026-10-27\n',
+      'utf8'
+    );
+    const todo = ejecutar(raiz, opciones);
+    assert.equal(punto(JSON.parse(todo.salida) as InformeDeploy, 'secretos-en-historial').estado, 'ok');
+    assert.equal(todo.codigo, 0);
+  });
+});
+
+test('capa: un silencio con el commit equivocado no tapa el hallazgo', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    await escribir(raiz, { 'viejo/prod.env': `K=${STRIPE}\n` });
+    git(['add', '-f', '.'], raiz);
+    await commit(raiz, 'env');
+    await escribir(raiz, {
+      '.taskcode/doctor-deploy.yml':
+        'silenciar_1_patron: stripe-live\nsilenciar_1_fichero: viejo/prod.env\nsilenciar_1_commit: "0000000"\nsilenciar_1_motivo: x\nsilenciar_1_quien: y\nsilenciar_1_fecha: 2026-10-27\n',
+    });
+    const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+    assert.equal(punto(informe, 'secretos-en-historial').estado, 'falla');
+  });
+});
+
+// ---------------------------------------------------------------------
+// --json, --escribir, flags, codigo de salida
+// ---------------------------------------------------------------------
+
+test('--json: una linea que pasa JSON.parse, con el contrato (version, commit, rama, tipos, puntos, resumen, codigo)', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    const r = ejecutar(raiz, opciones);
+    assert.ok(r.salida.endsWith('\n'));
+    assert.equal(r.salida.trim().split('\n').length, 1);
+    const o = JSON.parse(r.salida) as Record<string, unknown>;
+    assert.equal(o['version'], 1);
+    assert.equal(o['comando'], 'doctor-deploy');
+    assert.equal(o['commit'], git(['rev-parse', 'HEAD'], raiz));
+    assert.equal(o['rama'], 'main');
+    assert.equal(o['arbolSucio'], false);
+    assert.ok(Array.isArray(o['tipos']) && Array.isArray(o['puntos']) && Array.isArray(o['avisos']));
+    const resumen = o['resumen'] as Record<string, number>;
+    assert.equal(resumen['ok']! + resumen['falla']! + resumen['noVerificado']! + resumen['noAplica']!, resumen['total']);
+    const p = (o['puntos'] as Array<Record<string, unknown>>)[0] as Record<string, unknown>;
+    for (const campo of ['id', 'severidad', 'metodo', 'estado', 'motivo', 'evidencias', 'arreglo', 'descripcion', 'referencia', 'desactivado']) {
+      assert.ok(campo in p, `falta el campo ${campo}`);
+    }
+  });
+});
+
+test('main(): con una FALLA sale 1 y stdout es solo el JSON; sin FALLA sale 0', async () => {
+  await conRepo({ 'README.md': '# x\n', '.gitignore': '.env\n' }, async (raiz) => {
+    const cwdAntes = process.cwd();
+    const salida: string[] = [];
+    const errores: string[] = [];
+    const out = process.stdout.write.bind(process.stdout);
+    const err = process.stderr.write.bind(process.stderr);
+    (process.stdout as unknown as { write: (c: string) => boolean }).write = (c: string) => (salida.push(String(c)), true);
+    (process.stderr as unknown as { write: (c: string) => boolean }).write = (c: string) => (errores.push(String(c)), true);
+    try {
+      process.chdir(raiz);
+      const limpio = await main(['doctor-deploy', '--json']);
+      assert.equal(limpio, 0);
+      assert.equal((JSON.parse(salida.join('')) as { codigo: number }).codigo, 0);
+
+      await escribir(raiz, { '.env': 'A=1\n' });
+      git(['add', '-f', '.env'], raiz);
+      await commit(raiz, 'env');
+      salida.length = 0;
+      const mal = await main(['doctor-deploy', '--json', '--escribir']);
+      assert.equal(mal, 1);
+      const o = JSON.parse(salida.join('')) as { codigo: number };
+      assert.equal(o.codigo, 1);
+      assert.match(errores.join(''), /Informe escrito en docs\/doctor-deploy\//, 'con --json el aviso va a stderr');
+    } finally {
+      process.chdir(cwdAntes);
+      process.stdout.write = out;
+      process.stderr.write = err;
+    }
+  });
+});
+
+test('flags desconocidos y argumentos sobrantes abortan; fuera de un repo Git tambien', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    assert.throws(() => ejecutar(raiz, opciones, ['--inventado']), (e: unknown) => e instanceof DoctorDeployCommandError && /flag desconocido "--inventado"/.test(e.message));
+    assert.throws(() => ejecutar(raiz, opciones, ['--json=1']), (e: unknown) => e instanceof DoctorDeployCommandError && /no lleva valor/.test(e.message));
+    assert.throws(() => ejecutar(raiz, opciones, ['algo']), (e: unknown) => e instanceof DoctorDeployCommandError && /no admite argumentos/.test(e.message));
+  });
+  const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-fuera-'));
+  try {
+    assert.throws(
+      () => runDoctorDeployCommand([], { repoCwd: fuera, opciones: { pathHerramientas: '' } }),
+      (e: unknown) => e instanceof DoctorDeployCommandError && /no es un repositorio Git/.test(e.message)
+    );
+  } finally {
+    await rm(fuera, { recursive: true, force: true });
+  }
+});
+
+test('--escribir: informe con commit, rama, tipos y una fila por punto; sin commitear; sin pisar el del mismo dia', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    const commitsAntes = git(['rev-list', '--count', 'HEAD'], raiz);
+    const hash = git(['rev-parse', 'HEAD'], raiz);
+    const dia = new Date(2026, 9, 27, 12, 0, 0); // 27 de octubre de 2026, hora local
+
+    const r1 = ejecutar(raiz, opciones, ['--escribir'], dia);
+    assert.equal(path.relative(realpathSync.native(raiz), r1.rutaInforme as string).replace(/\\/g, '/'), 'docs/doctor-deploy/2026-10-27.md');
+    const md = await readFile(r1.rutaInforme as string, 'utf8');
+    assert.ok(md.includes(`- Commit: ${hash}`));
+    assert.ok(md.includes('- Rama: main'));
+    assert.match(md, /- Arbol de trabajo: limpio/);
+    assert.match(md, /- Tipos detectados: Node\.js \(\.\)/);
+    assert.match(md, /no es una certificacion/);
+    const filas = md.split('\n').filter((l) => /^\| [a-z0-9-]+ \| (critica|alta|media|baja) \|/.test(l));
+    assert.equal(filas.length, TOTAL_PUNTOS);
+    assert.match(r1.mensajeEscritura, /No se ha commiteado/);
+
+    // No commitea ni toca nada mas.
+    assert.equal(git(['rev-list', '--count', 'HEAD'], raiz), commitsAntes);
+    assert.equal(git(['status', '--porcelain'], raiz), '?? docs/');
+
+    // Segunda ejecucion el mismo dia: otro fichero, el primero intacto; ahora el arbol esta sucio y lo dice.
+    const r2 = ejecutar(raiz, opciones, ['--escribir'], dia);
+    assert.equal(path.basename(r2.rutaInforme as string), '2026-10-27-2.md');
+    assert.equal(await readFile(r1.rutaInforme as string, 'utf8'), md);
+    const md2 = await readFile(r2.rutaInforme as string, 'utf8');
+    assert.match(md2, /- Arbol de trabajo: SUCIO/);
+    assert.ok(r2.informe.arbolSucio);
+
+    // Sin restos temporales.
+    const restos = (await readdir(path.join(raiz, 'docs', 'doctor-deploy'))).filter((f) => !f.endsWith('.md'));
+    assert.deepEqual(restos, []);
+  });
+});
+
+test('sin --escribir no se crea nada en el repo', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    ejecutar(raiz, opciones);
+    ejecutar(raiz, opciones, []);
+    assert.equal(git(['status', '--porcelain'], raiz), '');
+  });
+});
+
+test('propiedad: en todos los repos probados, ningun OK sin evidencia y todo NO VERIFICADO / NO APLICA con motivo', async () => {
+  for (const archivos of [NODE, RUST, PYTHON, { ...NODE, 'src/c.js': `k="${STRIPE}"\n` }]) {
+    await conRepo(archivos, async (raiz, opciones) => {
+      assertInvariantes(JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy);
+    });
+  }
+});
+
+test('herramientas ausentes con PATH controlado: NO VERIFICADO diciendo cual falta, nunca OK ni FALLA', async () => {
+  await conRepo(
+    { ...NODE, ...RUST, ...PYTHON, 'go.mod': 'module x\n', 'App.csproj': '<Project/>\n', 'pom.xml': '<project/>\n' },
+    async (raiz, opciones) => {
+      const informe = JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+      const dep = punto(informe, 'dependencias-vulnerables');
+      assert.equal(dep.estado, 'no-verificado');
+      for (const falta of ['falta npm', 'falta cargo-audit', 'falta pip-audit', 'falta dotnet', 'falta govulncheck']) {
+        assert.ok(dep.motivo.includes(falta), `no dice "${falta}": ${dep.motivo}`);
+      }
+      assert.match(dep.motivo, /Java .* no hay herramienta de auditoria soportada/);
+      assert.match(punto(informe, 'secretos-en-historial').evidencias.map((e) => e.descripcion).join('\n'), /gitleaks no esta instalado/);
+    }
+  );
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-auditoria.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-auditoria.test.ts
new file mode 100644
index 0000000..c64bc75
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-auditoria.test.ts
@@ -0,0 +1,96 @@
+/**
+ * TASK-066: interpretes de la salida de las herramientas de auditoria. Se
+ * prueban con muestras del formato documentado de cada herramienta (no se
+ * ejecutan: necesitan red). Lo que importa: una salida que no se entiende es
+ * NO VERIFICADO, nunca OK; FALLA solo desde alta/critica.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import {
+  interpretarCargoAudit,
+  interpretarDotnetVulnerable,
+  interpretarGovulncheck,
+  interpretarNpmAudit,
+  interpretarPipAudit,
+  interpretarYarnAudit,
+} from '../../src/core/doctor-deploy-auditoria.js';
+
+const npm = (v: Record<string, number>, extra: Record<string, unknown> = {}): string =>
+  JSON.stringify({ metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, ...v } }, ...extra });
+
+test('npm: cero vulnerabilidades es OK', () => {
+  assert.equal(interpretarNpmAudit('npm', npm({}), 0).estado, 'ok');
+});
+
+test('npm: moderadas y bajas se listan pero no fallan', () => {
+  const v = interpretarNpmAudit('npm', npm({ moderate: 2, low: 1 }, { vulnerabilities: { lodash: { severity: 'moderate' } } }), 1);
+  assert.equal(v.estado, 'ok');
+  assert.deepEqual(v.otras, ['lodash (moderate)']);
+});
+
+test('npm: alta o critica es FALLA y nombra el paquete', () => {
+  const v = interpretarNpmAudit('npm', npm({ high: 1 }, { vulnerabilities: { minimist: { severity: 'high' } } }), 1);
+  assert.equal(v.estado, 'falla');
+  assert.deepEqual(v.graves, ['minimist (high)']);
+  assert.equal(interpretarNpmAudit('npm', npm({ critical: 1 }), 1).estado, 'falla');
+});
+
+test('npm: error de red, JSON roto, sin metadata o codigo raro son NO VERIFICADO', () => {
+  assert.equal(interpretarNpmAudit('npm', JSON.stringify({ error: { code: 'ENOTFOUND', summary: 'sin red' } }), 1).estado, 'no-verificado');
+  assert.equal(interpretarNpmAudit('npm', 'esto no es json', 0).estado, 'no-verificado');
+  assert.equal(interpretarNpmAudit('npm', '{}', 0).estado, 'no-verificado');
+  assert.equal(interpretarNpmAudit('npm', npm({}), 2).estado, 'no-verificado');
+  assert.equal(interpretarNpmAudit('npm', npm({}), null).estado, 'no-verificado');
+  // exit 1 sin vulnerabilidades en el informe: algo fallo
+  assert.equal(interpretarNpmAudit('npm', npm({}), 1).estado, 'no-verificado');
+});
+
+test('yarn clasico: lee auditSummary y los avisos', () => {
+  const limpio = '{"type":"auditSummary","data":{"vulnerabilities":{"info":0,"low":0,"moderate":0,"high":0,"critical":0}}}\n';
+  assert.equal(interpretarYarnAudit(limpio).estado, 'ok');
+  const malo =
+    '{"type":"auditAdvisory","data":{"advisory":{"module_name":"tar","severity":"high"}}}\n' +
+    '{"type":"auditSummary","data":{"vulnerabilities":{"info":0,"low":0,"moderate":0,"high":1,"critical":0}}}\n';
+  const v = interpretarYarnAudit(malo);
+  assert.equal(v.estado, 'falla');
+  assert.deepEqual(v.graves, ['tar (high)']);
+  assert.equal(interpretarYarnAudit('{"type":"info"}\n').estado, 'no-verificado');
+  assert.equal(interpretarYarnAudit('basura').estado, 'no-verificado');
+});
+
+test('cargo audit: found false es OK, found true es FALLA (sin severidad = alta), lo ilegible NO VERIFICADO', () => {
+  assert.equal(interpretarCargoAudit(JSON.stringify({ vulnerabilities: { found: false, count: 0, list: [] } }), 0).estado, 'ok');
+  const malo = JSON.stringify({ vulnerabilities: { found: true, count: 1, list: [{ advisory: { id: 'RUSTSEC-2020-0001' }, package: { name: 'time' } }] } });
+  const v = interpretarCargoAudit(malo, 1);
+  assert.equal(v.estado, 'falla');
+  assert.deepEqual(v.graves, ['time (RUSTSEC-2020-0001)']);
+  assert.equal(interpretarCargoAudit('{}', 0).estado, 'no-verificado');
+  assert.equal(interpretarCargoAudit('', 2).estado, 'no-verificado');
+});
+
+test('pip-audit: dependencias sin vulns es OK; con vulns, FALLA', () => {
+  const limpio = JSON.stringify({ dependencies: [{ name: 'flask', version: '3.0.0', vulns: [] }] });
+  assert.equal(interpretarPipAudit(limpio, 0).estado, 'ok');
+  const malo = JSON.stringify({ dependencies: [{ name: 'flask', version: '0.1', vulns: [{ id: 'PYSEC-1' }] }] });
+  assert.equal(interpretarPipAudit(malo, 1).estado, 'falla');
+  assert.equal(interpretarPipAudit('{"otra":1}', 0).estado, 'no-verificado');
+  assert.equal(interpretarPipAudit(limpio, 3).estado, 'no-verificado');
+});
+
+test('dotnet: lee la severidad de la tabla; sin tabla ni confirmacion, NO VERIFICADO', () => {
+  const malo = "The following sources were used:\n\nProject `app` has the following vulnerable packages\n   [net8.0]:\n   Top-level Package      Requested   Resolved   Severity   Advisory URL\n   > Newtonsoft.Json      12.0.1      12.0.1     High       https://github.com/advisories/GHSA-5crp\n   > Other.Pkg            1.0.0       1.0.0      Moderate   https://x\n";
+  const v = interpretarDotnetVulnerable(malo, 0);
+  assert.equal(v.estado, 'falla');
+  assert.deepEqual(v.graves, ['Newtonsoft.Json (High)']);
+  assert.deepEqual(v.otras, ['Other.Pkg (Moderate)']);
+  assert.equal(interpretarDotnetVulnerable("The given project `app` has no vulnerable packages given the current sources.\n", 0).estado, 'ok');
+  assert.equal(interpretarDotnetVulnerable('error NU1100\n', 0).estado, 'no-verificado');
+  assert.equal(interpretarDotnetVulnerable('', 1).estado, 'no-verificado');
+});
+
+test('govulncheck: exige confirmacion explicita para OK', () => {
+  assert.equal(interpretarGovulncheck('No vulnerabilities found.\n', 0).estado, 'ok');
+  assert.equal(interpretarGovulncheck('Vulnerability #1: GO-2023-1234\n  algo\n', 3).estado, 'falla');
+  assert.equal(interpretarGovulncheck('', 0).estado, 'no-verificado');
+  assert.equal(interpretarGovulncheck('boom', 1).estado, 'no-verificado');
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-catalogo.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-catalogo.test.ts
new file mode 100644
index 0000000..f5385aa
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-catalogo.test.ts
@@ -0,0 +1,279 @@
+/**
+ * TASK-066: el catalogo real de `doctor-deploy` (scripts/doctor-deploy.yml) y la
+ * capa del proyecto. El catalogo real se parsea de verdad (no una copia de
+ * prueba): si alguien borra un punto pedido o rompe el formato, falla aqui.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFileSync } from 'node:fs';
+import {
+  cargarCatalogoDeploy,
+  combinarCatalogo,
+  DoctorDeployCatalogoError,
+  parsearCapaProyecto,
+  parsearCatalogoDeploy,
+  resolverRutaCatalogoDeploy,
+  SONDAS_REGISTRADAS,
+  type CatalogoBase,
+} from '../../src/core/doctor-deploy-catalogo.js';
+import { SONDAS } from '../../src/fs/sondas-deploy.js';
+
+const BASE = cargarCatalogoDeploy();
+const CONTENIDO = readFileSync(resolverRutaCatalogoDeploy(), 'utf8');
+
+/** Los 20 puntos pedidos, con el id con que se registran. */
+const LOS_20 = [
+  'secretos-en-arbol', // esconder API keys
+  'secretos-en-historial', // limpiar secretos de git
+  'clave-publica-en-cliente-db',
+  'rls-activo',
+  'cifrado-en-reposo',
+  'auth-en-servidor',
+  'restringir-accesos',
+  'mass-assignment',
+  'cookies-seguras',
+  'hash-de-contrasenas',
+  'rate-limits',
+  'proteccion-de-bots',
+  'queries-parametrizadas',
+  'validacion-de-inputs',
+  'fuga-de-contenido',
+  'uploads-seguros',
+  'limitar-respuestas-api',
+  'security-headers',
+  'https-obligatorio',
+  'dependencias-vulnerables',
+];
+
+const ANADIDOS = [
+  'cors-restringido',
+  'proteccion-csrf',
+  'debug-y-source-maps',
+  'variables-entorno-documentadas',
+  'lockfile-versionado',
+  'contenedor-sin-root-ni-secretos',
+  'logs-sin-datos-sensibles',
+  'errores-sin-traza',
+  'redirecciones-y-ssrf',
+  'caducidad-de-sesion',
+  'backups-y-migraciones',
+  'health-check',
+  'licencias-de-dependencias',
+  'tests-en-verde',
+  // Dominio: su sonda determinista llega en una tarea posterior.
+  'reglas-firebase-abiertas',
+  'migraciones-sin-rls',
+  'tokens-en-ficheros-de-gestor',
+  'compose-con-contrasenas',
+  'ci-pull-request-target',
+  'acciones-ci-sin-sha',
+  'dockerfile-sin-user',
+  // Pedidos aparte en el enunciado.
+  'ficheros-secretos-versionados',
+  'gitignore-cubre-env',
+];
+
+test('el catalogo real tiene los 20 puntos pedidos y los anadidos', () => {
+  const ids = new Set(BASE.puntos.map((p) => p.id));
+  for (const id of [...LOS_20, ...ANADIDOS]) assert.ok(ids.has(id), `falta el punto "${id}"`);
+  assert.equal(ids.size, BASE.puntos.length, 'ids repetidos');
+});
+
+test('cada punto tiene todos los campos, y los deterministas una sonda registrada', () => {
+  for (const p of BASE.puntos) {
+    assert.match(p.id, /^[a-z0-9][a-z0-9-]*$/);
+    assert.ok(['critica', 'alta', 'media', 'baja'].includes(p.severidad), p.id);
+    assert.ok(p.tipos.length > 0, p.id);
+    assert.ok(p.arreglo.length > 10, `${p.id}: arreglo`);
+    assert.ok(p.descripcion.length > 10, `${p.id}: descripcion`);
+    if (p.metodo === 'determinista') {
+      assert.ok(p.sonda !== null && SONDAS_REGISTRADAS.includes(p.sonda), `${p.id}: sonda`);
+    } else {
+      assert.equal(p.sonda, null, `${p.id}: un punto de juicio no lleva sonda`);
+    }
+  }
+});
+
+test('las sondas registradas y las implementadas son las mismas seis', () => {
+  assert.deepEqual([...SONDAS_REGISTRADAS].sort(), Object.keys(SONDAS).sort());
+  assert.equal(SONDAS_REGISTRADAS.length, 6);
+  const usadas = new Set(BASE.puntos.flatMap((p) => (p.sonda === null ? [] : [p.sonda])));
+  for (const s of SONDAS_REGISTRADAS) assert.ok(usadas.has(s), `ningun punto usa la sonda "${s}"`);
+});
+
+test('solo hay seis puntos deterministas: todo lo demas es de juicio (D6)', () => {
+  const deterministas = BASE.puntos.filter((p) => p.metodo === 'determinista').map((p) => p.id);
+  assert.equal(deterministas.length, 6, deterministas.join(', '));
+});
+
+test('el arreglo de los secretos en git dice rotar primero y reescribir despues', () => {
+  const p = BASE.puntos.find((x) => x.id === 'secretos-en-historial');
+  assert.ok(p !== undefined);
+  assert.match(p.arreglo, /Rota la clave primero/);
+  assert.ok(p.arreglo.indexOf('Rota') < p.arreglo.indexOf('reescribe'));
+});
+
+test('los tipos de aplicacion son datos e incluyen los pedidos', () => {
+  const ids = BASE.tipos.map((t) => t.id);
+  for (const id of ['node', 'npm', 'pnpm', 'yarn', 'rust', 'python', 'java', 'maven', 'gradle', 'dotnet', 'go', 'php', 'ruby', 'docker', 'frontend']) {
+    assert.ok(ids.includes(id), `falta el tipo "${id}"`);
+  }
+  for (const t of BASE.tipos) assert.ok(t.marcadores.length > 0, t.id);
+});
+
+test('el catalogo no menciona ningun proyecto concreto y es ASCII: se distribuye a otros repos', () => {
+  for (const termino of ['taskcode', 'taskctl', 'gitflow']) {
+    assert.equal(new RegExp(`\\b${termino}`, 'i').test(CONTENIDO), false, `menciona "${termino}"`);
+  }
+  const noAscii = CONTENIDO.split(/\r?\n/)
+    .map((l, i) => ({ l, n: i + 1 }))
+    .filter(({ l }) => /[^\t\x20-\x7E]/.test(l));
+  assert.deepEqual(noAscii.map((x) => x.n), []);
+});
+
+// ---------------------------------------------------------------------
+// Parseo del catalogo
+// ---------------------------------------------------------------------
+
+const MINIMO = `total_tipos: 1
+total_puntos: 1
+tipo_1_id: node
+tipo_1_marcadores: [package.json]
+punto_1_id: mio
+punto_1_severidad: alta
+punto_1_tipos: [todos]
+punto_1_metodo: juicio
+punto_1_arreglo: Arreglalo
+punto_1_descripcion: Algo
+`;
+
+function errorDe(f: () => unknown): string {
+  try {
+    f();
+  } catch (e) {
+    assert.ok(e instanceof DoctorDeployCatalogoError, `no es DoctorDeployCatalogoError: ${String(e)}`);
+    return e.message;
+  }
+  assert.fail('deberia haber abortado');
+}
+
+test('un catalogo minimo parsea', () => {
+  const c = parsearCatalogoDeploy(MINIMO, 'x.yml');
+  assert.equal(c.puntos[0]?.id, 'mio');
+  assert.equal(c.puntos[0]?.referencia, null);
+});
+
+test('catalogo: total_puntos distinto de las entradas aborta', () => {
+  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('total_puntos: 1', 'total_puntos: 2'), 'x.yml')), /total_puntos/);
+});
+
+test('catalogo: determinista sin sonda, o con sonda desconocida, aborta; juicio con sonda tambien', () => {
+  const det = MINIMO.replace('metodo: juicio', 'metodo: determinista');
+  assert.match(errorDe(() => parsearCatalogoDeploy(det, 'x.yml')), /exige "punto_1_sonda"/);
+  assert.match(errorDe(() => parsearCatalogoDeploy(`${det}punto_1_sonda: inventada\n`, 'x.yml')), /no es una comprobacion registrada/);
+  assert.match(errorDe(() => parsearCatalogoDeploy(`${MINIMO}punto_1_sonda: lockfile\n`, 'x.yml')), /no tiene sentido/);
+});
+
+test('catalogo: tipo desconocido en un punto, clave desconocida y clave repetida abortan', () => {
+  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('[todos]', '[cobol]'), 'x.yml')), /el tipo "cobol"|tipo "cobol"/);
+  assert.match(errorDe(() => parsearCatalogoDeploy(`${MINIMO}punto_1_inventado: x\n`, 'x.yml')), /clave desconocida/);
+  assert.match(errorDe(() => parsearCatalogoDeploy(`${MINIMO}punto_1_id: otro\n`, 'x.yml')), /repetida/);
+});
+
+test('catalogo: falta un campo obligatorio aborta con el nombre de la clave', () => {
+  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('punto_1_arreglo: Arreglalo\n', ''), 'x.yml')), /punto_1_arreglo/);
+});
+
+// ---------------------------------------------------------------------
+// Capa del proyecto
+// ---------------------------------------------------------------------
+
+const baseConDos: CatalogoBase = parsearCatalogoDeploy(
+  `${MINIMO.replace('total_puntos: 1', 'total_puntos: 2')}` +
+    'punto_2_id: otro\npunto_2_severidad: baja\npunto_2_tipos: [node]\npunto_2_metodo: determinista\npunto_2_sonda: lockfile\npunto_2_arreglo: Arreglo largo\npunto_2_descripcion: Descripcion larga\n',
+  'x.yml'
+);
+
+test('capa: sin ficheros, vacia', () => {
+  const c = parsearCapaProyecto('', 'p.yml', baseConDos);
+  assert.deepEqual(c, { desactivados: [], anadidos: [], silencios: [], avisos: [] });
+});
+
+test('capa: desactivar sin motivo aborta y dice por que', () => {
+  const m = errorDe(() => parsearCapaProyecto('desactivar_1_id: mio\n', 'p.yml', baseConDos));
+  assert.match(m, /exige "desactivar_1_motivo"/);
+  assert.match(errorDe(() => parsearCapaProyecto('desactivar_1_id: mio\ndesactivar_1_motivo:\n', 'p.yml', baseConDos)), /exige "desactivar_1_motivo"/);
+});
+
+test('capa: desactivar con motivo funciona y combinar lo marca; un id desconocido solo avisa', () => {
+  const capa = parsearCapaProyecto(
+    'desactivar_1_id: mio\ndesactivar_1_motivo: Es una libreria sin servidor\ndesactivar_2_id: no-existe\ndesactivar_2_motivo: x\n',
+    'p.yml',
+    baseConDos
+  );
+  assert.equal(capa.desactivados.length, 2);
+  assert.equal(capa.avisos.length, 1);
+  assert.match(capa.avisos[0] as string, /"no-existe", que no existe/);
+  const efectivo = combinarCatalogo(baseConDos, capa);
+  assert.equal(efectivo.desactivados.get('mio'), 'Es una libreria sin servidor');
+  assert.equal(efectivo.desactivados.has('no-existe'), false);
+});
+
+test('capa: anadir un punto de juicio o con sonda registrada vale; un id repetido aborta', () => {
+  const nuevo =
+    'punto_1_id: propio\npunto_1_severidad: media\npunto_1_tipos: [todos]\npunto_1_metodo: juicio\npunto_1_arreglo: A\npunto_1_descripcion: D\n';
+  const capa = parsearCapaProyecto(nuevo, 'p.yml', baseConDos);
+  assert.equal(capa.anadidos[0]?.origen, 'proyecto');
+  assert.deepEqual(combinarCatalogo(baseConDos, capa).puntos.map((p) => p.id), ['mio', 'otro', 'propio']);
+
+  assert.match(errorDe(() => parsearCapaProyecto(nuevo.replace('propio', 'mio'), 'p.yml', baseConDos)), /ya existe en el catalogo del plugin/);
+  assert.match(
+    errorDe(() => parsearCapaProyecto(`${nuevo}${nuevo.replace(/punto_1/g, 'punto_2')}`, 'p.yml', baseConDos)),
+    /ya existe en este mismo fichero/
+  );
+  // El proyecto no inyecta codigo: una sonda que no esta registrada aborta.
+  assert.match(
+    errorDe(() => parsearCapaProyecto(nuevo.replace('juicio', 'determinista') + 'punto_1_sonda: mi-script\n', 'p.yml', baseConDos)),
+    /no es una comprobacion registrada/
+  );
+});
+
+test('capa: una clave desconocida avisa y se ignora', () => {
+  const capa = parsearCapaProyecto('algo_raro: 1\n', 'p.yml', baseConDos);
+  assert.equal(capa.avisos.length, 1);
+  assert.match(capa.avisos[0] as string, /clave desconocida "algo_raro"/);
+});
+
+const SILENCIO =
+  'silenciar_1_patron: stripe-live\nsilenciar_1_fichero: config\\prod.env\nsilenciar_1_commit: ABCDEF1\nsilenciar_1_motivo: Rotada el 2026-10-01\nsilenciar_1_quien: carlos\nsilenciar_1_fecha: 2026-10-27\n';
+
+test('capa: un silencio lleva patron, fichero, motivo, quien y fecha; commit es opcional', () => {
+  const capa = parsearCapaProyecto(SILENCIO, 'p.yml', baseConDos);
+  assert.deepEqual(capa.silencios[0], {
+    numero: 1,
+    patron: 'stripe-live',
+    fichero: 'config/prod.env',
+    commit: 'abcdef1',
+    motivo: 'Rotada el 2026-10-01',
+    quien: 'carlos',
+    fecha: '2026-10-27',
+  });
+  const sinCommit = parsearCapaProyecto(SILENCIO.replace(/silenciar_1_commit.*\n/, ''), 'p.yml', baseConDos);
+  assert.equal(sinCommit.silencios[0]?.commit, null);
+});
+
+test('capa: un silencio sin motivo, sin quien, con fecha mala o con commit mal formado aborta', () => {
+  for (const campo of ['motivo', 'quien', 'fecha', 'patron', 'fichero']) {
+    const sin = SILENCIO.split('\n').filter((l) => !l.startsWith(`silenciar_1_${campo}:`)).join('\n');
+    assert.match(errorDe(() => parsearCapaProyecto(sin, 'p.yml', baseConDos)), new RegExp(`silenciar_1_${campo}`));
+  }
+  assert.match(errorDe(() => parsearCapaProyecto(SILENCIO.replace('2026-10-27', 'ayer'), 'p.yml', baseConDos)), /AAAA-MM-DD/);
+  assert.match(errorDe(() => parsearCapaProyecto(SILENCIO.replace('ABCDEF1', 'zzz'), 'p.yml', baseConDos)), /hash de commit/);
+  // Un hash de solo digitos se leeria como numero (y perderia ceros): hay que citarlo.
+  assert.match(errorDe(() => parsearCapaProyecto(SILENCIO.replace('ABCDEF1', '1234567'), 'p.yml', baseConDos)), /entre comillas/);
+  assert.equal(parsearCapaProyecto(SILENCIO.replace('ABCDEF1', '"0123456"'), 'p.yml', baseConDos).silencios[0]?.commit, '0123456');
+});
+
+test('capa: numeracion con saltos aborta', () => {
+  assert.match(errorDe(() => parsearCapaProyecto('desactivar_2_id: mio\ndesactivar_2_motivo: x\n', 'p.yml', baseConDos)), /faltan las claves "desactivar_1_/);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/secretos.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/secretos.test.ts
new file mode 100644
index 0000000..acff0e7
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/secretos.test.ts
@@ -0,0 +1,78 @@
+/**
+ * TASK-066: patrones de claves y enmascarado. Cada patron tiene su par
+ * «detecta» / «no da falso positivo».
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { buscarSecretos, enmascarar, ocultarSecretos } from '../../src/core/secretos.js';
+
+const b64url = (o: unknown): string => Buffer.from(JSON.stringify(o)).toString('base64url');
+const jwt = (payload: unknown): string => `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.firmaFirmaFirmaFirma`;
+
+const AWS = 'AKIA' + 'ABCDEFGHIJKLMNOP';
+const STRIPE = 'sk_live_' + 'Zq81xKd0TvR4mNb7YcW2pLfH';
+
+test('detecta una clave de AWS y una sk_live_, con linea, y sin devolver el valor', () => {
+  const h = buscarSecretos(`# config\nAWS=${AWS}\n\nSTRIPE="${STRIPE}"\n`);
+  assert.deepEqual(h.map((x) => [x.patron, x.clase, x.linea]), [
+    ['aws-access-key', 'secreto', 2],
+    ['stripe-live', 'secreto', 4],
+  ]);
+  for (const x of h) {
+    assert.ok(!JSON.stringify(x).includes(AWS.slice(4)), 'el valor crudo no puede estar en el hallazgo');
+    assert.ok(!JSON.stringify(x).includes(STRIPE.slice(5)), 'el valor crudo no puede estar en el hallazgo');
+  }
+});
+
+test('las claves de ejemplo y de prueba no son secretos', () => {
+  const h = buscarSecretos('AKIAIOSFODNN7EXAMPLE\nsk_test_4eC39HqLyjWDarjtT1zdp7dc\n');
+  assert.deepEqual(h.map((x) => [x.patron, x.clase]), [['aws-access-key', 'ejemplo'], ['stripe-test', 'ejemplo']]);
+});
+
+test('Supabase: la anon es publica y la service_role es secreta; otro JWT se descarta', () => {
+  const h = buscarSecretos(
+    `ANON=${jwt({ role: 'anon' })}\nSERVICE=${jwt({ role: 'service_role' })}\nSESION=${jwt({ sub: 'u1' })}\n`
+  );
+  assert.deepEqual(h.map((x) => [x.patron, x.clase, x.linea]), [
+    ['supabase-anon', 'publica', 1],
+    ['supabase-service-role', 'secreto', 2],
+  ]);
+});
+
+test('Firebase: la apiKey web AIza es publica', () => {
+  const h = buscarSecretos('apiKey: "AIza' + 'SyA-1234567890abcdefghijklmnopqrstu' + '"');
+  assert.deepEqual(h.map((x) => [x.patron, x.clase]), [['firebase-web-api-key', 'publica']]);
+});
+
+test('clave privada PEM, token de GitHub y de Slack', () => {
+  const t = `-----BEGIN RSA PRIVATE KEY-----\nxx\n-----END RSA PRIVATE KEY-----\nghp_${'a1B2c3D4e5'.repeat(4)}\nxoxb-1234567890-abcdefghij\n`;
+  assert.deepEqual(buscarSecretos(t).map((x) => x.patron), ['clave-privada', 'github-token', 'slack-token']);
+  assert.deepEqual(buscarSecretos('-----BEGIN PUBLIC KEY-----\n'), []);
+});
+
+test('URL con credenciales: una contrasena real si, un marcador o localhost no', () => {
+  assert.deepEqual(buscarSecretos('postgres://app:Xk29sLq81Zp@db.interno.net/prod').map((x) => x.patron), ['url-con-credenciales']);
+  assert.deepEqual(buscarSecretos('postgres://app:password@db.interno.net/prod'), []);
+  assert.deepEqual(buscarSecretos('postgres://app:Xk29sLq81Zp@localhost/dev'), []);
+  assert.deepEqual(buscarSecretos('postgres://app:${DB_PASSWORD}@db.interno.net/prod'), []);
+});
+
+test('texto normal, hashes de integridad y UUID no son claves', () => {
+  const t = 'sha512-Zq81xKd0TvR4mNb7YcW2pLfHabcdefghijklmnopqrstuvwxyz0123456789==\n550e8400-e29b-41d4-a716-446655440000\nconst token = getToken();\n';
+  assert.deepEqual(buscarSecretos(t), []);
+});
+
+test('enmascarar deja como mucho 4 caracteres y la longitud', () => {
+  assert.equal(enmascarar(STRIPE), 'sk_l**** (32 caracteres)');
+  assert.equal(enmascarar('abc'), '**** (3 caracteres)');
+});
+
+test('ocultarSecretos reescribe cualquier clave que se haya colado en un texto', () => {
+  const t = `error con ${STRIPE} y ${AWS} y postgres://app:Xk29sLq81Zp@db.interno.net/x`;
+  const o = ocultarSecretos(t);
+  assert.ok(!o.includes(STRIPE.slice(4)));
+  assert.ok(!o.includes(AWS.slice(4)));
+  assert.ok(!o.includes('Xk29sLq81Zp'));
+  assert.match(o, /app:\*\*\*\*@db\.interno\.net/);
+  assert.equal(ocultarSecretos(o), o, 'es idempotente');
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/cli-flags-desconocidos.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/cli-flags-desconocidos.test.ts
index 31dd84c..c23e078 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/cli-flags-desconocidos.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/integracion/cli-flags-desconocidos.test.ts
@@ -1,7 +1,7 @@
 /**
  * TASK-047 (auditoria D4): un flag que el comando no conoce aborta en vez de
  * ignorarse en silencio. Unitarios de rechazarFlagsDesconocidos y, contra
- * repos Git temporales reales, los 13 comandos por main().
+ * repos Git temporales reales, los 14 comandos por main().
  */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
@@ -154,6 +154,7 @@ const COMANDOS: ReadonlyArray<{ cmd: string; args: string[] }> = [
   { cmd: 'pausa', args: ['TASK-001'] },
   { cmd: 'siguiente', args: ['TASK-001'] },
   { cmd: 'cadena', args: ['abrir', 'TASK-001'] },
+  { cmd: 'doctor-deploy', args: [] },
 ];
 
 for (const { cmd, args } of COMANDOS) {
````

## Excluido del diff (21 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-066/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-066/planificacion/brainstorm/peticion-brainstorm-dominio-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-066/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-066/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-066/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-066/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-066/planificacion/brainstorm/salida-brainstorm-dominio-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-066/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-066/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-066/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-066/tarea.md                                                       |   6 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  31 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor-deploy.js                              | 226 +++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-auditoria.js                        | 229 ++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-catalogo.js                         | 365 ++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy.js                                  | 145 ++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/secretos.js                                       | 153 +++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/deteccion-app.js                                    |  55 +++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git-crudo.js                                        |  32 ++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/herramientas-deploy.js                              | 100 +++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sondas-deploy.js                                    | 751 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 21 files changed, 2090 insertions(+), 3 deletions(-)
````
