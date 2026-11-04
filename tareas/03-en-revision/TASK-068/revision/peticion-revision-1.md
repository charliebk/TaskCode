# Peticion de revision — TASK-068 (ronda 1)

- Tarea: TASK-068 — Doctor-deploy C: tipo de aplicacion y sondas deterministas extra
- Rama revisada: feature/task-068-doctor-deploy-c-tipo-de-aplicacion-y-son
- Rama base: develop
- Commit revisado (HEAD): 9c414f3f12d58cf05e77755aaf299f41160c9bdb
- Fecha: 2026-11-04
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-068 (criterios de aceptacion y plan)

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
9c414f3 update(feature): develop -> feature/task-068-doctor-deploy-c-tipo-de-aplicacion-y-son
0879606 chore(TASK-068): coste implementacion +28715018 tokens (3 agentes)
c1d4e66 docs(TASK-068): README y CHANGELOG de clase de aplicacion, sondas de configuracion y OWASP 2025
ccd6c83 merge(TASK-068): frente B, siete sondas deterministas de configuracion
e05c5b0 feat(TASK-068): el revisor de seguridad nombra los puntos que ya son sonda
6313594 feat(TASK-068): siete sondas deterministas de configuracion (puntos 37-43)
a780209 merge(TASK-068): frente A, tipo de aplicacion como segundo eje
78b46aa feat(TASK-068): tests del eje de tipo de aplicacion
a90d914 feat(TASK-068): tipo de aplicacion como segundo eje de doctor-deploy
c5b6aa1 merge(TASK-068): frente C, referencias OWASP Top 10 2025 y ASVS 5.0
5f39b6c feat(TASK-068): referencias OWASP Top 10 2025 y ASVS 5.0 en el catalogo
1c0fe79 chore(TASK-068): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 461b5ea..a2c8271 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -7,6 +7,33 @@
 - TASK-066 (feature) — Doctor-deploy A: catalogo generico y comprobaciones deterministas (2026-10-27)
 - TASK-067 (feature) — Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso en release (2026-10-27)
 
+Doctor-deploy C (TASK-068): clase de aplicacion, sondas de configuracion y OWASP 2025.
+
+- **Clase de aplicacion**: doctor-deploy detecta web, api, Android, iOS, Flutter,
+  React Native, CLI o libreria como segundo eje, independiente del lenguaje
+  (familia `aplicacion_N_*` del catalogo). Los puntos pueden declarar
+  `punto_N_aplicaciones`. En una CLI o una libreria sin marcadores de web ni de
+  api, los puntos de servicio desplegado (HTTPS, cookies, cabeceras, rate limits,
+  backups, health check, bots, respuestas de la API, CORS y CSRF) salen NO APLICA
+  con el tipo y el marcador en el motivo; sin clase detectada siguen aplicando.
+- **Siete sondas deterministas nuevas**: `reglas-firebase-abiertas`,
+  `migraciones-sin-rls`, `tokens-en-ficheros-de-gestor`, `compose-con-contrasenas`,
+  `ci-pull-request-target`, `acciones-ci-sin-sha` y `dockerfile-sin-user` pasan de
+  juicio a determinista: el agente revisor ya no los recibe y un veredicto suyo
+  para ellos se rechaza. Silencios por hallazgo para sus patrones. Valores
+  secretos siempre enmascarados.
+- **Referencias**: el campo `referencia` pasa de OWASP Top 10 2021 a OWASP Top 10
+  2025 + ASVS 5.0, remapeado por significado (SSRF de A10 a A01, inyeccion de A03
+  a A05...). La tabla esta en `docs/doctor-deploy-referencias-owasp.md`.
+- **Compatibilidad**:
+  - El JSON de `doctor-deploy` pasa a `version: 3` con el campo `aplicaciones`;
+    quien compruebe `version === 2` tiene que actualizarlo.
+  - Los puntos 37-43 antes salian siempre NO VERIFICADO, que no cambia el codigo
+    de salida; ahora pueden dar FALLA. Un CI que use `taskctl doctor-deploy` como
+    puerta puede ponerse rojo al actualizar el plugin sin que el proyecto haya
+    cambiado: revisa los hallazgos y arreglalos o silencia los falsos positivos.
+    Los ids de punto y de tipo no cambian.
+
 Doctor-deploy B (TASK-067), segunda mitad de doctor-deploy.
 
 - **Puntos de juicio**: nueva skill `/taskcode-plugin:doctor-deploy` y agente
diff --git a/docs/doctor-deploy-referencias-owasp.md b/docs/doctor-deploy-referencias-owasp.md
new file mode 100644
index 0000000..8bc9266
--- /dev/null
+++ b/docs/doctor-deploy-referencias-owasp.md
@@ -0,0 +1,123 @@
+# Referencias OWASP del catálogo de `doctor-deploy`
+
+TASK-068 sustituye las referencias «OWASP Top 10 2021 Axx» de
+`scripts/doctor-deploy.yml` por la versión vigente del OWASP Top 10 y del ASVS.
+El mapeo se ha rehecho **por significado**, no por número: entre 2021 y 2025 las
+categorías se renumeran (criptografía pasa de A02 a A04, inyección de A03 a A05,
+SSRF deja de ser A10 y se integra en A01…).
+
+Formato uniforme del campo: `OWASP Top 10 2025 Axx; ASVS 5.0 Vnn`, con la
+categoría del Top 10 y el capítulo del ASVS que mejor cubren el punto.
+
+## Fuentes consultadas (2026-11-04)
+
+| Dato | URL | Lo que dice |
+|---|---|---|
+| Versión vigente del Top 10 | https://owasp.org/Top10/ → 308 a https://top10.owasp.org/ → redirige a `2025/en/` | La edición vigente es **OWASP Top 10:2025** |
+| Categorías del Top 10 2025 | https://top10.owasp.org/2025/ y https://github.com/OWASP/Top10/tree/master/2025/docs/en | A01..A10, lista de abajo |
+| Cambios respecto a 2021 | https://top10.owasp.org/2025/0x00_2025-Introduction/ | SSRF se integra en A01; A03 amplía «Vulnerable and Outdated Components»; A10 es nueva |
+| CWE por categoría | Páginas `https://top10.owasp.org/2025/A0N_2025-*/` | Ver la columna «razón» |
+| Versión vigente del ASVS | https://owasp.org/asvs → 308 a https://asvs.owasp.org/ | **ASVS 5.0.0**, «Stable release», publicada el 30 de mayo de 2025 |
+| Nada estable más nuevo | https://github.com/OWASP/ASVS/releases | Tras 5.0.0 solo hay la build «Bleeding Edge» (tag `latest`, 2026-10-26), que el propio repo marca como no estable |
+| Capítulos del ASVS 5.0 | https://github.com/OWASP/ASVS/tree/master/5.0/en | V1..V17, lista de abajo |
+| Secciones usadas | `https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x1N-V*.md` (V1, V2, V3, V11, V13, V14, V15, V16) | Ver la columna «razón» |
+
+No verificado: la página del Top 10 2025 no indica fecha de publicación (solo
+«2021-2025» en el copyright); se da por vigente porque la portada oficial
+redirige a ella.
+
+**OWASP Top 10:2025** — A01 Broken Access Control · A02 Security
+Misconfiguration · A03 Software Supply Chain Failures · A04 Cryptographic
+Failures · A05 Injection · A06 Insecure Design · A07 Authentication Failures ·
+A08 Software or Data Integrity Failures · A09 Security Logging and Alerting
+Failures · A10 Mishandling of Exceptional Conditions.
+
+**ASVS 5.0** — V1 Encoding and Sanitization · V2 Validation and Business Logic ·
+V3 Web Frontend Security · V4 API and Web Service · V5 File Handling ·
+V6 Authentication · V7 Session Management · V8 Authorization · V9 Self-contained
+Tokens · V10 OAuth and OIDC · V11 Cryptography · V12 Secure Communication ·
+V13 Configuration · V14 Data Protection · V15 Secure Coding and Architecture ·
+V16 Security Logging and Error Handling · V17 WebRTC.
+
+## Mapeo
+
+Prefijo común omitido: «OWASP Top 10 2021» en la vieja, «OWASP Top 10 2025 … ;
+ASVS 5.0 …» en la nueva. (D) = caso dudoso, comentado abajo.
+
+| # | Punto | Vieja | Nueva | Razón |
+|---|---|---|---|---|
+| 1 | secretos-en-arbol | A02 | A07; V13 | (D) Credenciales escritas en el código: CWE-798/259 están en A07:2025; ASVS 13.3 Secret Management |
+| 2 | secretos-en-historial | A02 | A07; V13 | (D) Igual que el 1, en el historial |
+| 3 | ficheros-secretos-versionados | A05 | A02; V13 | Configuración: CWE-260 (contraseña en fichero de configuración) en A02; 13.3 |
+| 4 | gitignore-cubre-env | A05 | A02; V13 | Igual que el 3 |
+| 5 | clave-publica-en-cliente-db | A01 | A01; V8 | Una clave de servicio en el cliente salta la autorización |
+| 6 | rls-activo | A01 | A01; V8 | Control de acceso por fila |
+| 7 | cifrado-en-reposo | A02 | A04; V14 | Criptografía pasa a A04; el cifrado en reposo está en 14.1.2 (V11 no lo trata) |
+| 8 | auth-en-servidor | A01 | A01; V8 | Autorización en una capa de confianza (V8.3) |
+| 9 | restringir-accesos | A01 | A01; V8 | Mínimo privilegio |
+| 10 | mass-assignment | A04 | A08; V15 | (D) CWE-915 está mapeada a A08:2025, no a A06; ASVS 15.3.3 |
+| 11 | cookies-seguras | A05 | A02; V3 | CWE-614/1004 en A02:2025; ASVS 3.3 Cookie Setup |
+| 12 | hash-de-contrasenas | A02 | A04; V11 | CWE-916 en A04:2025; ASVS 11.4.2 |
+| 13 | rate-limits | A04 | A06; V2 | Insecure Design pasa a A06 (CWE-799); ASVS 2.4 Anti-automation |
+| 14 | proteccion-de-bots | A04 | A06; V2 | Igual que el 13 (2.4.2) |
+| 15 | queries-parametrizadas | A03 | A05; V1 | Inyección pasa a A05 (CWE-89); ASVS 1.2.4 |
+| 16 | validacion-de-inputs | A03 | A05; V2 | CWE-20 en A05:2025; validación con esquema en 2.2 (el escape de salida es V1) |
+| 17 | fuga-de-contenido | A01 | A01; V8 | IDOR: control de acceso |
+| 18 | uploads-seguros | A04 | A06; V5 | CWE-434 en A06:2025; ASVS V5 File Handling |
+| 19 | limitar-respuestas-api | A01 | A01; V15 | Exposición de datos; ASVS 15.3.1 (devolver solo los campos necesarios) |
+| 20 | security-headers | A05 | A02; V3 | Configuración; ASVS 3.4 Browser Security Mechanism Headers |
+| 21 | https-obligatorio | A02 | A04; V12 | CWE-319 en A04:2025; ASVS V12 Secure Communication |
+| 22 | dependencias-vulnerables | A06 | A03; V15 | A03:2025 amplía la antigua A06 (CWE-1395); ASVS 15.2.1 |
+| 23 | cors-restringido | A05 | A02; V3 | CWE-942 en A02:2025; ASVS 3.4.2 |
+| 24 | proteccion-csrf | A01 | A01; V3 | CWE-352 en A01:2025; ASVS 3.5 Browser Origin Separation |
+| 25 | debug-y-source-maps | A05 | A02; V13 | CWE-489 en A02:2025; ASVS 13.4.2 |
+| 26 | variables-entorno-documentadas | A05 | A02; V13 | Configuración; ASVS 13.1 Configuration Documentation |
+| 27 | lockfile-versionado | A08 | A03; V15 | (D) Cadena de suministro: elegir y fijar versiones de dependencias; ASVS 15.2.4 |
+| 28 | contenedor-sin-root-ni-secretos | A05 | A02; V13 | Configuración del despliegue; ASVS 13.2.2 y 13.3 |
+| 29 | logs-sin-datos-sensibles | A09 | A09; V16 | CWE-532 en A09:2025; ASVS 16.2.5 |
+| 30 | errores-sin-traza | A05 | A10; V16 | CWE-209/550 en la nueva A10:2025; ASVS 16.5.1 |
+| 31 | redirecciones-y-ssrf | A10 | A01; V1 | SSRF (CWE-918) y open redirect (CWE-601) en A01:2025; SSRF en ASVS 1.3.6 (las redirecciones, en 3.7) |
+| 32 | caducidad-de-sesion | A07 | A07; V7 | CWE-613 en A07:2025; ASVS V7 Session Management |
+| 33 | backups-y-migraciones | A04 | A06; V14 | (D) Insecure Design pasa a A06; el ASVS 5.0 no tiene requisito de copias de seguridad |
+| 34 | health-check | A09 | A02; V13 | (D) Lo comprobable es que no revele información interna: ASVS 13.4.5 (endpoints de monitorización expuestos) |
+| 35 | licencias-de-dependencias | — | — | Sin referencia, a propósito (ver abajo) |
+| 36 | tests-en-verde | A08 | A08; V15 | (D) Integridad de lo que se publica; ningún capítulo del ASVS pide tests |
+| 37 | reglas-firebase-abiertas | A01 | A01; V8 | Control de acceso a los datos |
+| 38 | migraciones-sin-rls | A01 | A01; V8 | Igual que el 6 |
+| 39 | tokens-en-ficheros-de-gestor | A02 | A02; V13 | CWE-260 en A02:2025 (aquí A02 es otra categoría que en 2021); ASVS 13.3 |
+| 40 | compose-con-contrasenas | A05 | A02; V13 | CWE-260 en A02:2025; ASVS 13.3 |
+| 41 | ci-pull-request-target | A08 | A03; V15 | (D) A03:2025 trata expresamente la seguridad del CI/CD y del servidor de build |
+| 42 | acciones-ci-sin-sha | A08 | A03; V15 | (D) Código de terceros en el build; ASVS 15.2.4 |
+| 43 | dockerfile-sin-user | A05 | A02; V13 | Configuración del contenedor; ASVS 13.2.2 |
+
+## Casos dudosos
+
+- **1–2 secretos en el árbol y en el historial (A07).** Las credenciales
+  escritas en el código (CWE-798, CWE-259) están mapeadas a A07:2025; las
+  claves criptográficas escritas (CWE-321), a A04; las contraseñas en
+  ficheros de configuración (CWE-260), a A02. Se elige A07 porque lo que el
+  punto busca son sobre todo API keys y tokens. Para los puntos de ficheros de
+  configuración (3, 4, 39, 40) se elige A02 por CWE-260.
+- **10 mass-assignment (A08).** Por significado encajaría en control de acceso,
+  pero el mapeo oficial de CWE-915 es A08:2025. Se sigue a la fuente.
+- **27 lockfile, 41 pull_request_target y 42 acciones sin SHA (A03).** A08:2025
+  también cita CI/CD sin comprobaciones de integridad (y CWE-829, CWE-494). Se
+  elige A03 porque su texto trata expresamente el CI/CD y las dependencias como
+  cadena de suministro. El ASVS 5.0 no tiene requisitos de CI; V15
+  (dependencias y arquitectura) es lo más cercano.
+- **33 backups-y-migraciones (V14).** El ASVS 5.0 no pide copias de
+  seguridad; V14 Data Protection es el capítulo más cercano (14.2.7,
+  retención).
+- **34 health-check (A02 en vez de A09).** Lo que el punto comprueba es que el
+  endpoint no revele información interna, que es configuración (ASVS 13.4.5).
+- **36 tests-en-verde (V15).** Ningún capítulo del ASVS pide que la suite pase;
+  V15 es lo más cercano.
+
+## Punto 35 licencias-de-dependencias: sin referencia
+
+Se deja sin referencia a propósito. Ni el OWASP Top 10 2025 ni el ASVS 5.0
+tratan la compatibilidad de licencias. La página de A03:2025 habla de
+dependencias vulnerables y comprometidas, no de licencias, y el inventario de
+componentes de ASVS 15.1.2 tampoco las pide. Citar una categoría sería forzar el
+dato. El campo es opcional en el catálogo, y un test comprueba que este es el
+único punto base sin referencia.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 69cbbc5..4141dc3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -569,18 +569,36 @@ puntos de juicio (ver «Puntos de juicio» más abajo).
   `vendor`, `target`, `dist` ni `build`, y lo muestra. Los tipos y sus marcadores
   son datos del catálogo (`tipo_N_*`): añadir uno no toca código. Si no detecta
   ninguno, lo dice (los puntos que dependen de un tipo salen NO APLICA).
+- **Clase de aplicación** (segundo eje, independiente del lenguaje): web, api,
+  android, ios, flutter, react-native, cli o libreria, con los marcadores de la
+  familia `aplicacion_N_*` del catálogo (`id`, `nombre`, `marcadores` y,
+  opcional, `contiene`: textos que debe contener el fichero marcador; un
+  `package.json` es `cli` si contiene `"bin"`). Sale como «Aplicacion
+  detectada», con el fichero que la decidió. Un punto puede declarar
+  `punto_N_aplicaciones: [web, api, ...]`: se combina con `punto_N_tipos` con
+  Y, y dentro de cada lista basta con uno. **Si no se detecta ninguna clase, el
+  punto aplica**; solo sale NO APLICA si se detecta alguna y ninguna está en la
+  lista, con el tipo y el marcador en el motivo. Hoy eso apaga los puntos de
+  servicio desplegado (https-obligatorio, cookies-seguras, security-headers,
+  rate-limits, backups-y-migraciones, health-check, proteccion-de-bots,
+  limitar-respuestas-api, cors-restringido y proteccion-csrf) en una CLI o una
+  librería sin marcadores de web ni de api. Un id desconocido o del eje
+  equivocado aborta, también en `.taskcode/doctor-deploy.yml`.
 - **Catálogo**: `scripts/doctor-deploy.yml` (formato plano `punto_N_*`, con
   `total_puntos`). 43 puntos: los 20 pedidos, los medibles que faltaban y los de
   dominio. Cada uno tiene `id`, `severidad`, `tipos`, `metodo` (`determinista` o
   `juicio`), `sonda` (solo los deterministas), `arreglo`, `descripcion` y
-  `referencia` opcional (categoría OWASP Top 10 2021).
+  `referencia` opcional, con la categoría del OWASP Top 10 2025 y el capítulo
+  del ASVS 5.0 que lo cubren (`OWASP Top 10 2025 Axx; ASVS 5.0 Vnn`);
+  licencias-de-dependencias no la lleva porque ninguno de los dos trata
+  licencias.
 - **Cuatro estados**: `OK` (con evidencia: nunca OK sin ella), `FALLA` (con
   evidencia —fichero y línea, o commit— y el arreglo del catálogo), `NO VERIFICADO`
   (diciendo qué falta: una herramienta, o la revisión con juicio) y `NO APLICA`
   (con el motivo). Sale con **0 sin FALLA y 1 con alguna**. Un NO VERIFICADO no
   cambia el código de salida, pero el resumen dice «N de M sin verificar»: salir
   con 0 no significa «listo para publicar».
-- **Qué comprueba de forma determinista** (las únicas seis sondas; todo lo demás
+- **Qué comprueba de forma determinista** (trece sondas; todo lo demás
   es de juicio y sale NO VERIFICADO hasta que se revise con criterio):
   secretos en el árbol; secretos en **todo el historial** de git (todas las
   ramas, etiquetas y refs; un clon superficial, un desbordamiento de límites o un
@@ -596,6 +614,22 @@ puntos de juicio (ver «Puntos de juicio» más abajo).
   alta o crítica y el resto se lista sin fallar; una herramienta que no publica
   severidad se trata como alta. Sin la herramienta, con timeout, con un código de
   salida inesperado o con una salida que no se entiende: NO VERIFICADO.
+- **Sondas de configuración** (puntos 37–43, sobre los ficheros versionados):
+  reglas de Firebase abiertas (`allow ... : if true`, `allow` sin condición,
+  modo de prueba por fecha, `".read": true`); tablas de `supabase/migrations/`
+  sin `enable row level security` en ninguna migración del conjunto;
+  credenciales literales en `.npmrc`, `.pypirc` y `settings.xml` de Maven
+  (`${NPM_TOKEN}`, `${env.X}` y las cifradas no cuentan); contraseñas y tokens
+  literales en `docker-compose*.yml`/`compose*.yaml` (`${X}` y `*_FILE` sí
+  valen); flujos con `pull_request_target` que traen el código del PR; acciones
+  de terceros sin fijar a un SHA de 40 caracteres (las de `actions/`, `github/`,
+  las locales y `docker://` no cuentan); y Dockerfile cuya etapa final corre
+  como root o con `ADD <url>` sin `--checksum`. Sin ficheros que revisar, el
+  punto sale NO APLICA con el motivo; un fichero ilegible o mayor que el límite
+  lo deja en NO VERIFICADO. Un token que ya da FALLA en `secretos-en-arbol` no
+  se cuenta otra vez en `tokens-en-ficheros-de-gestor`. Cada hallazgo se
+  silencia con `patron` + `fichero` + `huella`; `dockerfile-sin-user` y
+  `pr-target-checkout` son del fichero entero y se silencian sin huella.
 - **Claves de ejemplo y públicas**: `AKIAIOSFODNN7EXAMPLE` y `sk_test_` no cuentan,
   ni la clave `anon`/`publishable` de Supabase ni la `apiKey` `AIza...` de la
   config web de Firebase; `service_role`, `sk_live_` y una clave privada sí. El
@@ -605,8 +639,8 @@ puntos de juicio (ver «Puntos de juicio» más abajo).
   primeros caracteres y la longitud (`sk_l**** (32 caracteres)`), y todo lo que
   sale (texto, JSON, informe) pasa además por una segunda red que enmascara
   cualquier clave que se cuele.
-- **`--json`**: una sola línea de JSON, **versión 2** (`version`, `commit`,
-  `rama`, `arbolSucio`, `tipos`, `avisos`, `puntos`, `veredictos`, `tareas`,
+- **`--json`**: una sola línea de JSON, **versión 3** (`version`, `commit`,
+  `rama`, `arbolSucio`, `tipos`, `aplicaciones`, `avisos`, `puntos`, `veredictos`, `tareas`,
   `resumen`, `codigo`). Cada punto lleva `origen`: `sonda` (lo decidió el
   comando) o `agente` (un veredicto con juicio incorporado con `--resultado`).
   `veredictos` y `tareas` son `null` si no se pidieron `--resultado` ni
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/agents/revisor-seguridad-deploy.md b/taskcode-marketplace/plugins/taskcode-plugin/agents/revisor-seguridad-deploy.md
index b27984d..857d8f3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/agents/revisor-seguridad-deploy.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/agents/revisor-seguridad-deploy.md
@@ -9,7 +9,10 @@ tools: Read, Grep, Glob
 Revisas, **con criterio**, los puntos de una lista de comprobación de seguridad
 que ninguna herramienta automática sabe medir con certeza. Otra herramienta ya
 comprobó los puntos deterministas (claves en el árbol y el historial, `.env`,
-`.gitignore`, lockfile, dependencias vulnerables): esos **no** son tuyos.
+`.gitignore`, lockfile, dependencias vulnerables, reglas de Firebase, RLS en las
+migraciones de Supabase, tokens en `.npmrc`/`.pypirc`/`settings.xml`,
+contraseñas en docker-compose, `pull_request_target`, acciones sin SHA y `USER`
+del Dockerfile): esos **no** son tuyos.
 
 Tu única pregunta, por punto, es:
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/doctor-deploy.yml b/taskcode-marketplace/plugins/taskcode-plugin/scripts/doctor-deploy.yml
index b03c1c9..a81803b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/doctor-deploy.yml
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/doctor-deploy.yml
@@ -16,22 +16,44 @@
 #     proyecto hasta 3 carpetas de profundidad, sin node_modules, vendor, target,
 #     dist ni build.
 #
+# TIPOS DE APLICACION (aplicacion_N_*). Segundo eje, independiente del
+# lenguaje: que clase de aplicacion es (web, api, movil, cli, libreria).
+# "total_aplicaciones" dice cuantos hay.
+#   - id: identificador estable (el que se usa en "aplicaciones" de cada
+#     punto). No puede coincidir con un id de tipo_N_.
+#   - nombre: como se muestra.
+#   - marcadores: como en los tipos (nombre, extension o sufijo de ruta, hasta
+#     3 carpetas de profundidad).
+#   - contiene: opcional; lista de textos. Si esta, un fichero marcador solo
+#     cuenta si contiene alguno de ellos (sin distinguir mayusculas). Se leen
+#     solo los ficheros marcador, y uno de mas de 1 MB no cuenta. Ejemplo: un
+#     package.json cuenta como "cli" solo si contiene "bin".
+# Puede detectarse mas de un tipo a la vez. Si no se detecta ninguno, los
+# puntos que dependen del tipo de aplicacion siguen aplicando.
+#
 # PUNTOS (punto_N_*).
 #   - id: identificador estable, en minusculas y con guiones.
 #   - severidad: critica | alta | media | baja.
 #   - tipos: tipos a los que aplica, o "todos". Si ninguno de esos tipos se
 #     detecta, el punto sale NO APLICA con el motivo.
+#   - aplicaciones: opcional; tipos de aplicacion a los que aplica (sin la
+#     linea, a todos). Se combina con "tipos" con Y, y dentro de cada lista
+#     basta con uno. Solo sale NO APLICA por este eje si se detecto algun
+#     tipo de aplicacion y ninguno esta en la lista; el motivo dice cual se
+#     detecto y por que fichero.
 #   - metodo: "determinista" (lo comprueba el comando, con evidencia) o "juicio"
 #     (hace falta leer el codigo con criterio: sale NO VERIFICADO hasta entonces).
 #   - sonda: solo en los deterministas; nombre de la comprobacion registrada.
 #   - arreglo: como se arregla.
 #   - descripcion: que se comprueba.
-#   - referencia: opcional; categoria OWASP Top 10 2021 que lo cubre.
+#   - referencia: opcional; "OWASP Top 10 2025 Axx; ASVS 5.0 Vnn": la categoria
+#     del OWASP Top 10 2025 y el capitulo del ASVS 5.0 que mejor lo cubren.
 #
 # Un proyecto puede desactivar o anadir puntos, y silenciar hallazgos concretos,
 # con su propio fichero de ajustes (ver la documentacion del comando).
 #
 total_tipos: 15
+total_aplicaciones: 8
 total_puntos: 43
 
 tipo_1_id: node
@@ -80,6 +102,42 @@ tipo_15_id: frontend
 tipo_15_nombre: Frontend web
 tipo_15_marcadores: [vite.config.js, vite.config.ts, next.config.js, next.config.mjs, next.config.ts, angular.json, svelte.config.js, nuxt.config.ts, astro.config.mjs, public/index.html]
 
+# --- Tipos de aplicacion -----------------------------------------------------
+# Ante la duda, un punto aplica: por eso web y api se detectan con generosidad
+# y cli y libreria solo con una senal explicita en el manifiesto.
+
+aplicacion_1_id: web
+aplicacion_1_nombre: Aplicacion web
+aplicacion_1_marcadores: [vite.config.js, vite.config.ts, next.config.js, next.config.mjs, next.config.ts, angular.json, svelte.config.js, nuxt.config.ts, nuxt.config.js, astro.config.mjs, remix.config.js, gatsby-config.js, public/index.html]
+aplicacion_2_id: api
+aplicacion_2_nombre: API o servicio web
+aplicacion_2_marcadores: [package.json, requirements.txt, pyproject.toml, Pipfile, pom.xml, build.gradle, build.gradle.kts, go.mod, Gemfile, composer.json, Cargo.toml, *.csproj, openapi.yaml, openapi.yml, openapi.json, swagger.yaml, swagger.json]
+aplicacion_2_contiene: ["\"express\"", "\"fastify\"", "\"koa\"", "\"@nestjs/core\"", "\"@hapi/hapi\"", "\"hono\"", flask, fastapi, django, spring-boot-starter-web, gin-gonic/gin, labstack/echo, gofiber/fiber, go-chi/chi, "gem \"rails\"", "gem 'rails'", sinatra, laravel/framework, symfony/framework-bundle, axum, actix-web, Microsoft.NET.Sdk.Web, "openapi:", "\"openapi\"", "swagger:", "\"swagger\""]
+aplicacion_3_id: android
+aplicacion_3_nombre: App Android
+aplicacion_3_marcadores: [AndroidManifest.xml, build.gradle, build.gradle.kts]
+aplicacion_3_contiene: [com.android.application, "<manifest"]
+aplicacion_4_id: ios
+aplicacion_4_nombre: App iOS
+aplicacion_4_marcadores: [project.pbxproj, Podfile]
+aplicacion_4_contiene: [iphoneos, "platform :ios"]
+aplicacion_5_id: flutter
+aplicacion_5_nombre: App Flutter
+aplicacion_5_marcadores: [pubspec.yaml]
+aplicacion_5_contiene: ["sdk: flutter"]
+aplicacion_6_id: react-native
+aplicacion_6_nombre: App React Native
+aplicacion_6_marcadores: [package.json, metro.config.js]
+aplicacion_6_contiene: ["\"react-native\"", "@react-native/"]
+aplicacion_7_id: cli
+aplicacion_7_nombre: Herramienta de linea de comandos
+aplicacion_7_marcadores: [package.json, Cargo.toml, pyproject.toml, setup.py, setup.cfg]
+aplicacion_7_contiene: ["\"bin\"", "[[bin]]", "[project.scripts]", "[tool.poetry.scripts]", console_scripts]
+aplicacion_8_id: libreria
+aplicacion_8_nombre: Libreria
+aplicacion_8_marcadores: [package.json, Cargo.toml, *.gemspec]
+aplicacion_8_contiene: ["\"exports\":", "\"peerDependencies\":", "[lib]", Gem::Specification]
+
 # --- Los 20 puntos de base ---------------------------------------------------
 
 punto_1_id: secretos-en-arbol
@@ -89,7 +147,7 @@ punto_1_metodo: determinista
 punto_1_sonda: secretos-arbol
 punto_1_arreglo: Saca la clave del codigo y leela de una variable de entorno o de un gestor de secretos. Si ya estuvo en un commit o en un remoto, da la clave por comprometida: rotala primero y reescribe el historial despues.
 punto_1_descripcion: Ninguna API key, token ni clave privada escrita en los ficheros del proyecto (se distinguen las claves de ejemplo o de prueba y las que son publicas a proposito).
-punto_1_referencia: OWASP Top 10 2021 A02
+punto_1_referencia: OWASP Top 10 2025 A07; ASVS 5.0 V13
 
 punto_2_id: secretos-en-historial
 punto_2_severidad: critica
@@ -98,7 +156,7 @@ punto_2_metodo: determinista
 punto_2_sonda: secretos-historial
 punto_2_arreglo: Rota la clave primero (revocala en el proveedor y emite otra): un secreto que llego a un remoto se da por comprometido. Despues, si quieres, reescribe el historial con git filter-repo o BFG y fuerza el push. Si ya la rotaste y no quieres reescribir, silencia ese hallazgo en los ajustes del proyecto, con su motivo.
 punto_2_descripcion: Ningun secreto en ningun commit de ninguna rama o etiqueta, aunque ya se haya borrado del arbol actual.
-punto_2_referencia: OWASP Top 10 2021 A02
+punto_2_referencia: OWASP Top 10 2025 A07; ASVS 5.0 V13
 
 punto_3_id: ficheros-secretos-versionados
 punto_3_severidad: critica
@@ -107,7 +165,7 @@ punto_3_metodo: determinista
 punto_3_sonda: ficheros-secretos
 punto_3_arreglo: Quita el fichero del indice con git rm --cached, anadelo al .gitignore y, si llego a un remoto, rota lo que contenia. Deja un .env.example con los nombres de las variables y sin valores.
 punto_3_descripcion: Ningun fichero .env, clave privada ni de credenciales versionado (un .env.example o .env.sample sin valores reales no cuenta).
-punto_3_referencia: OWASP Top 10 2021 A05
+punto_3_referencia: OWASP Top 10 2025 A02; ASVS 5.0 V13
 
 punto_4_id: gitignore-cubre-env
 punto_4_severidad: alta
@@ -116,7 +174,7 @@ punto_4_metodo: determinista
 punto_4_sonda: gitignore-env
 punto_4_arreglo: Anade .env y .env.* al .gitignore (y deja pasar .env.example con una excepcion !.env.example).
 punto_4_descripcion: El .gitignore cubre los ficheros .env, para que un secreto local no llegue a un commit por descuido.
-punto_4_referencia: OWASP Top 10 2021 A05
+punto_4_referencia: OWASP Top 10 2025 A02; ASVS 5.0 V13
 
 punto_5_id: clave-publica-en-cliente-db
 punto_5_severidad: critica
@@ -124,15 +182,15 @@ punto_5_tipos: [frontend, node]
 punto_5_metodo: juicio
 punto_5_arreglo: En el cliente usa solo la clave publica o anon de la base de datos (nunca service_role, claves de administrador ni cuentas de servicio) y protege los datos con reglas de acceso por fila.
 punto_5_descripcion: El cliente de la base de datos que va al navegador o a la app usa solo la clave publica o anon.
-punto_5_referencia: OWASP Top 10 2021 A01
+punto_5_referencia: OWASP Top 10 2025 A01; ASVS 5.0 V8
 
 punto_6_id: rls-activo
 punto_6_severidad: critica
 punto_6_tipos: [todos]
 punto_6_metodo: juicio
 punto_6_arreglo: Activa la seguridad a nivel de fila en cada tabla expuesta (por ejemplo ALTER TABLE ... ENABLE ROW LEVEL SECURITY) y escribe una politica por operacion; sin politica, nadie accede.
-punto_6_descripcion: Toda tabla accesible desde el cliente tiene seguridad a nivel de fila (RLS) con politicas que limitan cada fila a quien le corresponde.
-punto_6_referencia: OWASP Top 10 2021 A01
+punto_6_descripcion: Cada tabla accesible desde el cliente tiene politicas RLS que limitan cada fila a quien le corresponde, y RLS activado si no se crea en supabase/migrations (las de ahi las comprueba migraciones-sin-rls).
+punto_6_referencia: OWASP Top 10 2025 A01; ASVS 5.0 V8
 
 punto_7_id: cifrado-en-reposo
 punto_7_severidad: alta
@@ -140,7 +198,7 @@ punto_7_tipos: [todos]
 punto_7_metodo: juicio
 punto_7_arreglo: Activa el cifrado en reposo de la base de datos, los discos y las copias de seguridad, y cifra a nivel de aplicacion los campos especialmente sensibles.
 punto_7_descripcion: Los datos personales o sensibles estan cifrados en reposo (base de datos, discos, copias).
-punto_7_referencia: OWASP Top 10 2021 A02
+punto_7_referencia: OWASP Top 10 2025 A04; ASVS 5.0 V14
 
 punto_8_id: auth-en-servidor
 punto_8_severidad: critica
@@ -148,7 +206,7 @@ punto_8_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend]
 punto_8_metodo: juicio
 punto_8_arreglo: Comprueba la identidad y el permiso en el servidor en cada peticion; ocultar un boton o una ruta en el cliente no protege nada.
 punto_8_descripcion: La autenticacion y la autorizacion se comprueban en el servidor, no solo en el cliente.
-punto_8_referencia: OWASP Top 10 2021 A01
+punto_8_referencia: OWASP Top 10 2025 A01; ASVS 5.0 V8
 
 punto_9_id: restringir-accesos
 punto_9_severidad: alta
@@ -156,7 +214,7 @@ punto_9_tipos: [todos]
 punto_9_metodo: juicio
 punto_9_arreglo: Aplica minimo privilegio: cada usuario, servicio y credencial con solo los permisos que necesita, y cierra al exterior los puertos y paneles de administracion.
 punto_9_descripcion: Los accesos (usuarios, servicios, credenciales, puertos, paneles) estan restringidos al minimo necesario.
-punto_9_referencia: OWASP Top 10 2021 A01
+punto_9_referencia: OWASP Top 10 2025 A01; ASVS 5.0 V8
 
 punto_10_id: mass-assignment
 punto_10_severidad: alta
@@ -164,15 +222,16 @@ punto_10_tipos: [node, python, java, dotnet, go, php, ruby, rust]
 punto_10_metodo: juicio
 punto_10_arreglo: No vuelques el cuerpo de la peticion directamente en el modelo: acepta una lista explicita de campos (DTO o lista blanca) y deja fuera los que el usuario no debe tocar (rol, saldo, propietario).
 punto_10_descripcion: Los endpoints no permiten asignar en masa campos que el usuario no debe poder modificar.
-punto_10_referencia: OWASP Top 10 2021 A04
+punto_10_referencia: OWASP Top 10 2025 A08; ASVS 5.0 V15
 
 punto_11_id: cookies-seguras
 punto_11_severidad: alta
 punto_11_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend]
+punto_11_aplicaciones: [web, api, android, ios, flutter, react-native]
 punto_11_metodo: juicio
 punto_11_arreglo: Marca las cookies de sesion con HttpOnly, Secure y SameSite (Lax o Strict) y limita su dominio y ruta.
 punto_11_descripcion: Las cookies de sesion llevan HttpOnly, Secure y SameSite.
-punto_11_referencia: OWASP Top 10 2021 A05
+punto_11_referencia: OWASP Top 10 2025 A02; ASVS 5.0 V3
 
 punto_12_id: hash-de-contrasenas
 punto_12_severidad: critica
@@ -180,23 +239,25 @@ punto_12_tipos: [node, python, java, dotnet, go, php, ruby, rust]
 punto_12_metodo: juicio
 punto_12_arreglo: Guarda las contrasenas con argon2id, scrypt o bcrypt (con sal propia y coste adecuado); nunca en claro ni con MD5, SHA-1 o SHA-256 sin mas.
 punto_12_descripcion: Las contrasenas se guardan con un hash lento y con sal, no en claro ni con un hash rapido.
-punto_12_referencia: OWASP Top 10 2021 A02
+punto_12_referencia: OWASP Top 10 2025 A04; ASVS 5.0 V11
 
 punto_13_id: rate-limits
 punto_13_severidad: alta
 punto_13_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_13_aplicaciones: [web, api, android, ios, flutter, react-native]
 punto_13_metodo: juicio
 punto_13_arreglo: Pon un limite de peticiones por IP y por cuenta, mas estricto en login, registro, recuperacion de contrasena y envio de correos.
 punto_13_descripcion: Los endpoints sensibles (login, registro, recuperacion, envios) tienen limite de peticiones.
-punto_13_referencia: OWASP Top 10 2021 A04
+punto_13_referencia: OWASP Top 10 2025 A06; ASVS 5.0 V2
 
 punto_14_id: proteccion-de-bots
 punto_14_severidad: media
 punto_14_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend]
+punto_14_aplicaciones: [web, api, android, ios, flutter, react-native]
 punto_14_metodo: juicio
 punto_14_arreglo: Anade un desafio (captcha o equivalente) en registro, login y formularios publicos, y limita la creacion automatica de cuentas.
 punto_14_descripcion: Los formularios publicos y el registro tienen proteccion contra bots.
-punto_14_referencia: OWASP Top 10 2021 A04
+punto_14_referencia: OWASP Top 10 2025 A06; ASVS 5.0 V2
 
 punto_15_id: queries-parametrizadas
 punto_15_severidad: critica
@@ -204,7 +265,7 @@ punto_15_tipos: [node, python, java, dotnet, go, php, ruby, rust]
 punto_15_metodo: juicio
 punto_15_arreglo: Usa consultas parametrizadas o un ORM; nunca concatenes entrada de la persona en una sentencia SQL, un comando o una consulta.
 punto_15_descripcion: Todas las consultas a la base de datos son parametrizadas, sin concatenar entrada externa.
-punto_15_referencia: OWASP Top 10 2021 A03
+punto_15_referencia: OWASP Top 10 2025 A05; ASVS 5.0 V1
 
 punto_16_id: validacion-de-inputs
 punto_16_severidad: alta
@@ -212,7 +273,7 @@ punto_16_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend]
 punto_16_metodo: juicio
 punto_16_arreglo: Valida en el servidor tipo, longitud, rango y formato de toda entrada con un esquema (lista blanca) y escapa la salida segun donde se pinte.
 punto_16_descripcion: Toda entrada externa se valida en el servidor con un esquema, y la salida se escapa.
-punto_16_referencia: OWASP Top 10 2021 A03
+punto_16_referencia: OWASP Top 10 2025 A05; ASVS 5.0 V2
 
 punto_17_id: fuga-de-contenido
 punto_17_severidad: alta
@@ -220,7 +281,7 @@ punto_17_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend]
 punto_17_metodo: juicio
 punto_17_arreglo: Comprueba en cada recurso que pertenece a quien lo pide (no basta con adivinar un id), no listes directorios y no sirvas ficheros privados desde una carpeta publica.
 punto_17_descripcion: Un usuario no puede leer contenido ajeno ni privado cambiando un id, una ruta o una URL.
-punto_17_referencia: OWASP Top 10 2021 A01
+punto_17_referencia: OWASP Top 10 2025 A01; ASVS 5.0 V8
 
 punto_18_id: uploads-seguros
 punto_18_severidad: alta
@@ -228,31 +289,34 @@ punto_18_tipos: [node, python, java, dotnet, go, php, ruby, rust]
 punto_18_metodo: juicio
 punto_18_arreglo: Limita tamano y tipo (por contenido, no por extension), renombra el fichero, guardalo fuera de la raiz web y nunca lo ejecutes ni lo sirvas con el tipo que declara quien lo sube.
 punto_18_descripcion: La subida de ficheros limita tamano y tipo, no usa el nombre original y no permite ejecutarlos.
-punto_18_referencia: OWASP Top 10 2021 A04
+punto_18_referencia: OWASP Top 10 2025 A06; ASVS 5.0 V5
 
 punto_19_id: limitar-respuestas-api
 punto_19_severidad: media
 punto_19_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_19_aplicaciones: [web, api, android, ios, flutter, react-native]
 punto_19_metodo: juicio
 punto_19_arreglo: Pagina las listas con un maximo, devuelve solo los campos necesarios (nunca el registro entero con hashes o campos internos) y limita el tamano de las respuestas.
 punto_19_descripcion: Las respuestas de la API estan paginadas y limitadas, y no exponen campos internos.
-punto_19_referencia: OWASP Top 10 2021 A01
+punto_19_referencia: OWASP Top 10 2025 A01; ASVS 5.0 V15
 
 punto_20_id: security-headers
 punto_20_severidad: alta
 punto_20_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend]
+punto_20_aplicaciones: [web, api, android, ios, flutter, react-native]
 punto_20_metodo: juicio
 punto_20_arreglo: Envia Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy y una politica de frame-ancestors (o X-Frame-Options).
 punto_20_descripcion: Las respuestas web llevan las cabeceras de seguridad habituales.
-punto_20_referencia: OWASP Top 10 2021 A05
+punto_20_referencia: OWASP Top 10 2025 A02; ASVS 5.0 V3
 
 punto_21_id: https-obligatorio
 punto_21_severidad: alta
 punto_21_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend, docker]
+punto_21_aplicaciones: [web, api, android, ios, flutter, react-native]
 punto_21_metodo: juicio
 punto_21_arreglo: Sirve todo por HTTPS con un certificado valido, redirige HTTP a HTTPS y activa HSTS.
 punto_21_descripcion: Todo el trafico va cifrado en transito con HTTPS y HTTP redirige a HTTPS.
-punto_21_referencia: OWASP Top 10 2021 A02
+punto_21_referencia: OWASP Top 10 2025 A04; ASVS 5.0 V12
 
 punto_22_id: dependencias-vulnerables
 punto_22_severidad: alta
@@ -261,25 +325,27 @@ punto_22_metodo: determinista
 punto_22_sonda: dependencias
 punto_22_arreglo: Actualiza la dependencia afectada a la version corregida (npm audit fix, cargo update -p, pip install -U, dotnet add package) o sustituyela. Las que no tienen arreglo se documentan con su motivo.
 punto_22_descripcion: Las dependencias de runtime no tienen vulnerabilidades conocidas de severidad alta o critica, segun la herramienta de auditoria del ecosistema (si esta instalada).
-punto_22_referencia: OWASP Top 10 2021 A06
+punto_22_referencia: OWASP Top 10 2025 A03; ASVS 5.0 V15
 
 # --- Medibles que completan el catalogo -------------------------------------
 
 punto_23_id: cors-restringido
 punto_23_severidad: alta
 punto_23_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_23_aplicaciones: [web, api, android, ios, flutter, react-native]
 punto_23_metodo: juicio
 punto_23_arreglo: Lista los origenes permitidos de forma explicita; nunca "*" con credenciales ni reflejar el origen recibido.
 punto_23_descripcion: La configuracion de CORS solo admite los origenes que deben llamar a la API.
-punto_23_referencia: OWASP Top 10 2021 A05
+punto_23_referencia: OWASP Top 10 2025 A02; ASVS 5.0 V3
 
 punto_24_id: proteccion-csrf
 punto_24_severidad: alta
 punto_24_tipos: [node, python, java, dotnet, go, php, ruby, rust]
+punto_24_aplicaciones: [web, api, android, ios, flutter, react-native]
 punto_24_metodo: juicio
 punto_24_arreglo: Usa tokens anti-CSRF o cookies SameSite en toda peticion que cambie estado y no cambies estado con GET.
 punto_24_descripcion: Las peticiones que cambian estado y usan cookies estan protegidas contra CSRF.
-punto_24_referencia: OWASP Top 10 2021 A01
+punto_24_referencia: OWASP Top 10 2025 A01; ASVS 5.0 V3
 
 punto_25_id: debug-y-source-maps
 punto_25_severidad: media
@@ -287,7 +353,7 @@ punto_25_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend]
 punto_25_metodo: juicio
 punto_25_arreglo: Desactiva el modo debug en produccion y no publiques los source maps (o subelos solo al servicio de errores).
 punto_25_descripcion: Produccion no corre en modo debug ni publica source maps.
-punto_25_referencia: OWASP Top 10 2021 A05
+punto_25_referencia: OWASP Top 10 2025 A02; ASVS 5.0 V13
 
 punto_26_id: variables-entorno-documentadas
 punto_26_severidad: baja
@@ -295,7 +361,7 @@ punto_26_tipos: [todos]
 punto_26_metodo: juicio
 punto_26_arreglo: Documenta cada variable de entorno en un .env.example (o en el README) con su nombre y para que sirve, sin valores reales.
 punto_26_descripcion: Las variables de entorno que necesita la aplicacion estan documentadas, sin valores.
-punto_26_referencia: OWASP Top 10 2021 A05
+punto_26_referencia: OWASP Top 10 2025 A02; ASVS 5.0 V13
 
 punto_27_id: lockfile-versionado
 punto_27_severidad: media
@@ -304,15 +370,15 @@ punto_27_metodo: determinista
 punto_27_sonda: lockfile
 punto_27_arreglo: Genera el lockfile de tu gestor (npm install, cargo generate-lockfile, pip freeze, composer install, bundle install) y versionalo. Una libreria que no lo versiona por convencion puede desactivar el punto con su motivo.
 punto_27_descripcion: El fichero de versiones exactas de las dependencias esta versionado, para que lo que se despliega sea lo que se probo.
-punto_27_referencia: OWASP Top 10 2021 A08
+punto_27_referencia: OWASP Top 10 2025 A03; ASVS 5.0 V15
 
 punto_28_id: contenedor-sin-root-ni-secretos
 punto_28_severidad: alta
 punto_28_tipos: [docker]
 punto_28_metodo: juicio
 punto_28_arreglo: Ejecuta el proceso con un usuario sin privilegios y pasa los secretos en tiempo de ejecucion (variables o secretos del orquestador), nunca con COPY, ARG o ENV dentro de la imagen.
-punto_28_descripcion: El contenedor no corre como root y la imagen no lleva secretos dentro.
-punto_28_referencia: OWASP Top 10 2021 A05
+punto_28_descripcion: La imagen no lleva secretos dentro (COPY, ARG o ENV) y el contenedor no acaba corriendo como root por otra via, como el orquestador o el entrypoint (el USER de la etapa final del Dockerfile lo comprueba dockerfile-sin-user).
+punto_28_referencia: OWASP Top 10 2025 A02; ASVS 5.0 V13
 
 punto_29_id: logs-sin-datos-sensibles
 punto_29_severidad: media
@@ -320,7 +386,7 @@ punto_29_tipos: [node, python, java, dotnet, go, php, ruby, rust]
 punto_29_metodo: juicio
 punto_29_arreglo: No registres contrasenas, tokens, cabeceras de autorizacion ni datos personales; enmascaralos antes de escribirlos.
 punto_29_descripcion: Los logs no contienen contrasenas, tokens ni datos personales.
-punto_29_referencia: OWASP Top 10 2021 A09
+punto_29_referencia: OWASP Top 10 2025 A09; ASVS 5.0 V16
 
 punto_30_id: errores-sin-traza
 punto_30_severidad: media
@@ -328,7 +394,7 @@ punto_30_tipos: [node, python, java, dotnet, go, php, ruby, rust]
 punto_30_metodo: juicio
 punto_30_arreglo: Devuelve a la persona un mensaje generico con un identificador y guarda la traza solo en el log del servidor.
 punto_30_descripcion: Las paginas y respuestas de error no muestran trazas, rutas internas ni consultas.
-punto_30_referencia: OWASP Top 10 2021 A05
+punto_30_referencia: OWASP Top 10 2025 A10; ASVS 5.0 V16
 
 punto_31_id: redirecciones-y-ssrf
 punto_31_severidad: alta
@@ -336,7 +402,7 @@ punto_31_tipos: [node, python, java, dotnet, go, php, ruby, rust]
 punto_31_metodo: juicio
 punto_31_arreglo: Redirige solo a destinos de una lista blanca y, al pedir una URL que da la persona, valida el destino y bloquea direcciones internas y de metadatos de la nube.
 punto_31_descripcion: No hay redirecciones abiertas ni peticiones del servidor a URLs arbitrarias (SSRF).
-punto_31_referencia: OWASP Top 10 2021 A10
+punto_31_referencia: OWASP Top 10 2025 A01; ASVS 5.0 V1
 
 punto_32_id: caducidad-de-sesion
 punto_32_severidad: media
@@ -344,23 +410,25 @@ punto_32_tipos: [node, python, java, dotnet, go, php, ruby, rust, frontend]
 punto_32_metodo: juicio
 punto_32_arreglo: Da caducidad a sesiones y tokens (corta para el acceso, renovable), invalidalos al cerrar sesion y al cambiar la contrasena.
 punto_32_descripcion: Las sesiones y los tokens caducan y se invalidan al cerrar sesion.
-punto_32_referencia: OWASP Top 10 2021 A07
+punto_32_referencia: OWASP Top 10 2025 A07; ASVS 5.0 V7
 
 punto_33_id: backups-y-migraciones
 punto_33_severidad: alta
 punto_33_tipos: [todos]
+punto_33_aplicaciones: [web, api, android, ios, flutter, react-native]
 punto_33_metodo: juicio
 punto_33_arreglo: Programa copias automaticas de la base de datos, prueba restaurarlas y versiona las migraciones para poder reproducir y deshacer los cambios de esquema.
 punto_33_descripcion: Hay copias de seguridad probadas y migraciones de esquema versionadas.
-punto_33_referencia: OWASP Top 10 2021 A04
+punto_33_referencia: OWASP Top 10 2025 A06; ASVS 5.0 V14
 
 punto_34_id: health-check
 punto_34_severidad: baja
 punto_34_tipos: [node, python, java, dotnet, go, php, ruby, rust, docker]
+punto_34_aplicaciones: [web, api, android, ios, flutter, react-native]
 punto_34_metodo: juicio
 punto_34_arreglo: Expon un endpoint de salud que no revele detalles internos y usalo en el orquestador y en la monitorizacion.
 punto_34_descripcion: El servicio tiene un health check que no revela informacion interna.
-punto_34_referencia: OWASP Top 10 2021 A09
+punto_34_referencia: OWASP Top 10 2025 A02; ASVS 5.0 V13
 
 punto_35_id: licencias-de-dependencias
 punto_35_severidad: baja
@@ -375,62 +443,69 @@ punto_36_tipos: [todos]
 punto_36_metodo: juicio
 punto_36_arreglo: Ejecuta la suite completa antes de publicar y publica solo un commit con los tests en verde.
 punto_36_descripcion: La suite de tests pasa en el commit que se publica.
-punto_36_referencia: OWASP Top 10 2021 A08
+punto_36_referencia: OWASP Top 10 2025 A08; ASVS 5.0 V15
 
 # --- Puntos de dominio (su sonda determinista llega en una tarea posterior) -
 
 punto_37_id: reglas-firebase-abiertas
 punto_37_severidad: critica
 punto_37_tipos: [todos]
-punto_37_metodo: juicio
+punto_37_metodo: determinista
+punto_37_sonda: reglas-firebase
 punto_37_arreglo: Sustituye reglas como "allow read, write: if true" por reglas que exijan sesion y comprueben el propietario; prueba las reglas con el emulador.
-punto_37_descripcion: Las reglas de Firebase (Firestore, Realtime Database y Storage) no estan abiertas a cualquiera.
-punto_37_referencia: OWASP Top 10 2021 A01
+punto_37_descripcion: Las reglas de Firebase versionadas (firestore.rules, storage.rules, database.rules.json) no tienen allow sin condicion, con if true o en modo de prueba por fecha, ni ".read"/".write": true.
+punto_37_referencia: OWASP Top 10 2025 A01; ASVS 5.0 V8
 
 punto_38_id: migraciones-sin-rls
 punto_38_severidad: alta
 punto_38_tipos: [todos]
-punto_38_metodo: juicio
+punto_38_metodo: determinista
+punto_38_sonda: migraciones-rls
 punto_38_arreglo: Cada migracion que crea una tabla debe activar RLS y crear sus politicas en la misma migracion.
-punto_38_descripcion: Ninguna migracion crea una tabla sin activar la seguridad a nivel de fila.
-punto_38_referencia: OWASP Top 10 2021 A01
+punto_38_descripcion: Toda tabla creada en las migraciones de Supabase (supabase/migrations) activa la seguridad a nivel de fila en alguna migracion.
+punto_38_referencia: OWASP Top 10 2025 A01; ASVS 5.0 V8
 
 punto_39_id: tokens-en-ficheros-de-gestor
 punto_39_severidad: critica
 punto_39_tipos: [node, python, java, dotnet, go, php, ruby, rust]
-punto_39_metodo: juicio
+punto_39_metodo: determinista
+punto_39_sonda: tokens-gestor
 punto_39_arreglo: Quita el token de .npmrc, .pypirc, settings.xml o equivalentes, usa una variable de entorno (por ejemplo ${NPM_TOKEN}) y rota el token expuesto.
-punto_39_descripcion: Los ficheros de configuracion de los gestores de paquetes (.npmrc, .pypirc, settings.xml) no llevan tokens ni contrasenas.
-punto_39_referencia: OWASP Top 10 2021 A02
+punto_39_descripcion: Los ficheros de configuracion de los gestores de paquetes versionados (.npmrc, .pypirc, settings.xml) no llevan tokens ni contrasenas literales.
+punto_39_referencia: OWASP Top 10 2025 A02; ASVS 5.0 V13
 
 punto_40_id: compose-con-contrasenas
 punto_40_severidad: alta
 punto_40_tipos: [docker]
-punto_40_metodo: juicio
+punto_40_metodo: determinista
+punto_40_sonda: compose-contrasenas
 punto_40_arreglo: Saca las contrasenas del docker-compose y leelas de un fichero .env ignorado por git o de secretos de Docker.
-punto_40_descripcion: Los ficheros docker-compose no llevan contrasenas ni tokens escritos.
-punto_40_referencia: OWASP Top 10 2021 A05
+punto_40_descripcion: Los ficheros docker-compose versionados no llevan contrasenas ni tokens literales (${VAR} y *_FILE si valen).
+punto_40_referencia: OWASP Top 10 2025 A02; ASVS 5.0 V13
 
 punto_41_id: ci-pull-request-target
 punto_41_severidad: alta
 punto_41_tipos: [todos]
-punto_41_metodo: juicio
+punto_41_metodo: determinista
+punto_41_sonda: ci-pull-request-target
 punto_41_arreglo: No uses el evento pull_request_target para ejecutar codigo de la rama de un fork; usa pull_request, o separa en dos flujos y no pases secretos al que ejecuta codigo ajeno.
-punto_41_descripcion: Los flujos de CI no ejecutan codigo de forks con permisos de escritura ni secretos (pull_request_target).
-punto_41_referencia: OWASP Top 10 2021 A08
+punto_41_descripcion: Ningun flujo de CI con pull_request_target trae el codigo del PR (ref al head del PR, refs/pull o gh pr checkout).
+punto_41_referencia: OWASP Top 10 2025 A03; ASVS 5.0 V15
 
 punto_42_id: acciones-ci-sin-sha
 punto_42_severidad: media
 punto_42_tipos: [todos]
-punto_42_metodo: juicio
+punto_42_metodo: determinista
+punto_42_sonda: acciones-sin-sha
 punto_42_arreglo: Fija cada accion de terceros a un SHA de commit completo (con la version en un comentario) en lugar de a una etiqueta movil.
-punto_42_descripcion: Las acciones de CI de terceros estan fijadas a un SHA de commit.
-punto_42_referencia: OWASP Top 10 2021 A08
+punto_42_descripcion: Las acciones de CI de terceros estan fijadas a un SHA de commit de 40 caracteres.
+punto_42_referencia: OWASP Top 10 2025 A03; ASVS 5.0 V15
 
 punto_43_id: dockerfile-sin-user
 punto_43_severidad: alta
 punto_43_tipos: [docker]
-punto_43_metodo: juicio
+punto_43_metodo: determinista
+punto_43_sonda: dockerfile-user
 punto_43_arreglo: Anade una instruccion USER con un usuario sin privilegios al final del Dockerfile y evita ADD de URLs remotas.
-punto_43_descripcion: El Dockerfile declara un USER distinto de root.
-punto_43_referencia: OWASP Top 10 2021 A05
+punto_43_descripcion: La etapa final de cada Dockerfile declara un USER distinto de root y ningun ADD descarga una URL sin --checksum.
+punto_43_referencia: OWASP Top 10 2025 A02; ASVS 5.0 V13
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/doctor-deploy/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/doctor-deploy/SKILL.md
index 28abd67..9b3e4f8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/doctor-deploy/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/doctor-deploy/SKILL.md
@@ -25,7 +25,8 @@ fichero y línea**; sin cita, el punto se queda NO VERIFICADO.
    JSON). **El código de salida 1 no es un error**: significa que hay alguna
    FALLA. Si falla de verdad (no es un repo, catálogo roto...), muestra el error
    tal cual: dice qué corregir.
-3. Del JSON saca el `commit` (sha completo), los `tipos` detectados y los
+3. Del JSON saca el `commit` (sha completo), los `tipos` y las `aplicaciones`
+   (tipo de aplicación: web, api, cli...) detectados y los
    puntos **de juicio que aplican**: los de `metodo: "juicio"` con `estado:
    "no-verificado"`. Los `no-aplica`, los desactivados y los deterministas no se
    le dan al agente. Si `arbolSucio` es `true`, dilo: el veredicto describe el
@@ -33,7 +34,7 @@ fichero y línea**; sin cita, el punto se queda NO VERIFICADO.
    salta al paso 7.
 4. Lanza el agente `revisor-seguridad-deploy` (herramienta Agent; el plugin lo
    ofrece como `taskcode-plugin:revisor-seguridad-deploy`). Pásale solo datos:
-   el commit, los tipos y, por punto, `id`, `descripcion` y `referencia`. **No
+   el commit, los tipos, las aplicaciones y, por punto, `id`, `descripcion` y `referencia`. **No
    pegues contenido del repositorio en la petición**: el agente lo lee él, y
    tiene instrucciones de tratarlo como dato, no como orden. Con más de doce
    puntos, reparte la lista entre varios agentes, en paralelo y en un solo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
index 9e4fc45..d779e47 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy.ts
@@ -12,8 +12,9 @@
  * Decisiones:
  * - Solo lee. Con `--escribir` guarda el informe en docs/doctor-deploy/ pero
  *   NO lo commitea (como `metricas --escribir`).
- * - Las unicas comprobaciones deterministas son las de fs/sondas-deploy.ts; el
- *   resto del catalogo es de juicio y sale NO VERIFICADO.
+ * - Las comprobaciones deterministas son las sondas de fs/sondas-deploy.ts y
+ *   fs/sondas-deploy-config.ts; el resto del catalogo es de juicio y sale NO
+ *   VERIFICADO.
  * - Una sonda que lanza una excepcion es NO VERIFICADO de ESE punto, nunca un
  *   throw hacia el CLI ni un OK.
  * - Codigo de salida: 0 sin FALLA, 1 con alguna. NO VERIFICADO no lo cambia,
@@ -38,6 +39,8 @@ import {
   formatearJson,
   formatearTexto,
   sanearPunto,
+  textoMarcadorAplicacion,
+  type AplicacionDetectada,
   type InformeDeploy,
   type ResultadoPunto,
 } from '../core/doctor-deploy.js';
@@ -52,7 +55,7 @@ import { ocultarSecretos } from '../core/secretos.js';
 import { ocultarCredenciales } from '../core/plataforma-remota.js';
 import { BaseBranchGuardError } from '../fs/git.js';
 import { crearTareasDeFallas, type ResultadoCrearTareas } from './doctor-deploy-tareas.js';
-import { detectarTipos, listarArchivos } from '../fs/deteccion-app.js';
+import { detectarAplicaciones, detectarTipos, listarArchivos } from '../fs/deteccion-app.js';
 import { comprobadorEnCommit } from '../fs/evidencia-veredicto.js';
 import { gitTexto } from '../fs/git-crudo.js';
 import { pathDelProceso } from '../fs/herramientas-deploy.js';
@@ -110,7 +113,33 @@ const salidaSegura = (t: string): string => ocultarSecretos(ocultarCredenciales(
 
 // ---------------------------------------------------------------------
 
-function evaluarPunto(punto: PuntoCatalogo, ctx: ContextoDeploy, cat: CatalogoEfectivo): ResultadoPunto {
+/**
+ * Eje de aplicacion (TASK-068), decision de la persona: sin ningun tipo de
+ * aplicacion detectado, el punto APLICA; solo sale NO APLICA si se detecto
+ * alguno y ninguno de los detectados esta en `punto.aplicaciones` (dentro del
+ * eje basta con uno: un repo con marcadores de cli y de web aplica). Devuelve
+ * el motivo del NO APLICA, que nombra cada tipo detectado y el marcador que lo
+ * decidio, o null si el punto aplica por este eje.
+ */
+export function motivoNoAplicaPorAplicacion(punto: PuntoCatalogo, aplicaciones: readonly AplicacionDetectada[]): string | null {
+  if (punto.aplicaciones === null || aplicaciones.length === 0) return null;
+  const lista = punto.aplicaciones;
+  if (aplicaciones.some((a) => lista.includes(a.id))) return null;
+  const detectadas = aplicaciones
+    .map((a) => {
+      const m = a.marcadores[0];
+      return m === undefined ? a.id : `${a.id} (por ${textoMarcadorAplicacion(m)})`;
+    })
+    .join(', ');
+  return `solo aplica a aplicaciones de tipo ${lista.join(' o ')}; aplicacion detectada: ${detectadas}`;
+}
+
+function evaluarPunto(
+  punto: PuntoCatalogo,
+  ctx: ContextoDeploy,
+  cat: CatalogoEfectivo,
+  aplicaciones: readonly AplicacionDetectada[]
+): ResultadoPunto {
   const base = {
     id: punto.id,
     severidad: punto.severidad,
@@ -147,6 +176,12 @@ function evaluarPunto(punto: PuntoCatalogo, ctx: ContextoDeploy, cat: CatalogoEf
     }
   }
 
+  // Los dos ejes se combinan con Y: aplica por lenguaje (arriba) Y por tipo de aplicacion.
+  const motivoAplicacion = motivoNoAplicaPorAplicacion(punto, aplicaciones);
+  if (motivoAplicacion !== null) {
+    return { ...base, estado: 'no-aplica', motivo: motivoAplicacion, evidencias: [] };
+  }
+
   if (punto.metodo === 'juicio' || punto.sonda === null) {
     return {
       ...base,
@@ -346,6 +381,7 @@ function analizar(argv: readonly string[], deps: DoctorDeployDeps): Analisis {
     throw new DoctorDeployCommandError('[ERROR] taskctl doctor-deploy: no se pudo listar los ficheros del proyecto (git ls-files fallo).');
   }
   const tipos = detectarTipos(archivos.presentes, catalogo.tipos);
+  const aplicaciones = detectarAplicaciones(raiz, archivos.presentes, catalogo.aplicaciones);
 
   const ctx: ContextoDeploy = {
     cwd: raiz,
@@ -364,7 +400,7 @@ function analizar(argv: readonly string[], deps: DoctorDeployDeps): Analisis {
     },
   };
 
-  const puntos = catalogo.puntos.map((p) => evaluarPunto(p, ctx, catalogo));
+  const puntos = catalogo.puntos.map((p) => evaluarPunto(p, ctx, catalogo, aplicaciones));
 
   const avisos = [...catalogo.avisos];
   if (tipos.length === 0) {
@@ -408,13 +444,14 @@ function analizar(argv: readonly string[], deps: DoctorDeployDeps): Analisis {
 
   const ahora = (deps.ahora ?? ((): Date => new Date()))();
   const informe: InformeDeploy = {
-    version: 2,
+    version: 3,
     comando: 'doctor-deploy',
     fecha: ahora.toISOString(),
     commit,
     rama: rama === null || rama.trim() === '' ? null : rama.trim(),
     arbolSucio: estado === null ? true : estado.trim() !== '',
     tipos,
+    aplicaciones,
     avisos,
     puntos: puntosFinales,
     veredictos,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
index b09ba4e..5608173 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-catalogo.ts
@@ -8,6 +8,11 @@
  * fallo en cerrado. El catalogo del plugin lo distribuye el plugin: si falta o
  * esta roto, la instalacion esta rota y se aborta.
  *
+ * Dos ejes (TASK-068): `tipo_N_*` (lenguaje y herramientas: node, rust,
+ * docker...) y `aplicacion_N_*` (tipo de aplicacion: web, api, cli,
+ * libreria...). Cada punto nombra los suyos en `punto_N_tipos` y, opcional,
+ * `punto_N_aplicaciones`; un id del eje equivocado aborta.
+ *
  * Capa del proyecto (`.taskcode/doctor-deploy.yml`, opcional):
  * - `desactivar_N_id` + `desactivar_N_motivo`: desactiva un punto. Sin motivo
  *   aborta (es una aceptacion de riesgo). Un id que no existe AVISA y se
@@ -24,6 +29,7 @@ import { readFileSync } from 'node:fs';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
 import { parseBloqueClaveValor, type ParClaveValor } from './frontmatter.js';
+import { PATRONES_REGLAS_SIN_HUELLA } from './doctor-deploy-reglas.js';
 
 export class DoctorDeployCatalogoError extends Error {
   constructor(message: string) {
@@ -37,15 +43,39 @@ export type Severidad = (typeof SEVERIDADES)[number];
 export const METODOS = ['determinista', 'juicio'] as const;
 export type Metodo = (typeof METODOS)[number];
 
-/** Comprobaciones deterministas que existen en el codigo (`fs/sondas-deploy.ts`). */
-export const SONDAS_REGISTRADAS: readonly string[] = [
+/**
+ * Comprobaciones deterministas que existen en el codigo (`fs/sondas-deploy.ts` y, las de
+ * configuracion de TASK-068, `fs/sondas-deploy-config.ts`). Es la fuente de verdad: el
+ * registro `SONDAS` se tipa con estos nombres y no compila si no coinciden.
+ */
+export const SONDAS_REGISTRADAS = [
   'secretos-arbol',
   'secretos-historial',
   'ficheros-secretos',
   'gitignore-env',
   'lockfile',
   'dependencias',
-];
+  'reglas-firebase',
+  'migraciones-rls',
+  'tokens-gestor',
+  'compose-contrasenas',
+  'ci-pull-request-target',
+  'acciones-sin-sha',
+  'dockerfile-user',
+] as const;
+export type SondaRegistrada = (typeof SONDAS_REGISTRADAS)[number];
+
+/** true si `sonda` es una comprobacion registrada. */
+export function esSondaRegistrada(sonda: string): sonda is SondaRegistrada {
+  return (SONDAS_REGISTRADAS as readonly string[]).includes(sonda);
+}
+
+/**
+ * Patrones de silencio cuyo hallazgo no tiene valor ni huella (es del fichero entero):
+ * un silencio de estos vale solo con patron + fichero. Para el resto, un silencio sin
+ * commit exige la huella (D3: no tapar un hallazgo nuevo del mismo patron y fichero).
+ */
+export const PATRONES_SIN_HUELLA: readonly string[] = ['fichero-secreto', ...PATRONES_REGLAS_SIN_HUELLA];
 
 /** Valor de `tipos` que significa «aplica siempre». */
 export const TIPO_TODOS = 'todos';
@@ -56,11 +86,34 @@ export interface TipoApp {
   marcadores: string[];
 }
 
+/**
+ * Tipo de aplicacion (TASK-068): el segundo eje, independiente del lenguaje
+ * (web, api, movil, cli, libreria). Se detecta por ficheros marcadores como los
+ * tipos, y opcionalmente por un texto que tiene que aparecer dentro del
+ * fichero marcador (`contiene`).
+ */
+export interface AplicacionCatalogo {
+  id: string;
+  nombre: string;
+  marcadores: string[];
+  /**
+   * Textos (basta uno, sin distinguir mayusculas) que tiene que contener el
+   * fichero marcador para contar; null = basta con que el fichero exista.
+   */
+  contiene: string[] | null;
+}
+
 export interface PuntoCatalogo {
   id: string;
   severidad: Severidad;
   /** Ids de tipo, o `['todos']`. */
   tipos: string[];
+  /**
+   * Ids de tipo de aplicacion a los que aplica; null = a todos. Se combina con
+   * `tipos` con Y; dentro de cada eje basta con uno (O). Solo deja el punto en
+   * NO APLICA si se detecto algun tipo de aplicacion y ninguno esta en la lista.
+   */
+  aplicaciones: string[] | null;
   metodo: Metodo;
   /** Solo en los deterministas. */
   sonda: string | null;
@@ -72,6 +125,7 @@ export interface PuntoCatalogo {
 
 export interface CatalogoBase {
   tipos: TipoApp[];
+  aplicaciones: AplicacionCatalogo[];
   puntos: PuntoCatalogo[];
 }
 
@@ -98,6 +152,7 @@ export interface CapaProyecto {
 
 export interface CatalogoEfectivo {
   tipos: TipoApp[];
+  aplicaciones: AplicacionCatalogo[];
   /** Los del plugin, en su orden, y detras los anadidos por el proyecto. */
   puntos: PuntoCatalogo[];
   /** id -> motivo de la desactivacion. */
@@ -112,7 +167,8 @@ export const RUTA_CAPA_PROYECTO = path.join('.taskcode', 'doctor-deploy.yml');
 
 const MAX_ENTRADAS = 500;
 const CAMPOS_TIPO = ['id', 'nombre', 'marcadores'] as const;
-const CAMPOS_PUNTO = ['id', 'severidad', 'tipos', 'metodo', 'sonda', 'arreglo', 'descripcion', 'referencia'] as const;
+const CAMPOS_APLICACION = ['id', 'nombre', 'marcadores', 'contiene'] as const;
+const CAMPOS_PUNTO = ['id', 'severidad', 'tipos', 'aplicaciones', 'metodo', 'sonda', 'arreglo', 'descripcion', 'referencia'] as const;
 const CAMPOS_DESACTIVAR = ['id', 'motivo'] as const;
 const CAMPOS_SILENCIAR = ['patron', 'fichero', 'commit', 'huella', 'motivo', 'quien', 'fecha'] as const;
 
@@ -265,6 +321,7 @@ function construirPunto(
   ruta: string,
   origen: 'plugin' | 'proyecto',
   idsDeTipo: ReadonlySet<string>,
+  idsDeAplicacion: ReadonlySet<string>,
   fallar: (m: string) => Error
 ): PuntoCatalogo {
   const p = `punto_${n}`;
@@ -277,6 +334,12 @@ function construirPunto(
   const cTipos = exigir(bloque, 'punto', n, 'tipos', ruta, fallar);
   const tipos = lista(cTipos, `${p}_tipos`, ruta, fallar);
   for (const t of tipos) {
+    if (idsDeAplicacion.has(t)) {
+      throw fallar(
+        `[ERROR] ${ruta}:${cTipos.numeroLinea}: "${p}_tipos" nombra "${t}", que es un tipo de aplicacion, no de lenguaje: ` +
+          `va en "${p}_aplicaciones".`
+      );
+    }
     if (t !== TIPO_TODOS && !idsDeTipo.has(t)) {
       throw fallar(
         `[ERROR] ${ruta}:${cTipos.numeroLinea}: "${p}_tipos" nombra el tipo "${t}", que no existe. ` +
@@ -284,6 +347,31 @@ function construirPunto(
       );
     }
   }
+  const cAplicaciones = bloque.get('aplicaciones');
+  let aplicaciones: string[] | null = null;
+  if (cAplicaciones !== undefined) {
+    aplicaciones = lista(cAplicaciones, `${p}_aplicaciones`, ruta, fallar);
+    for (const a of aplicaciones) {
+      if (a === TIPO_TODOS) {
+        throw fallar(
+          `[ERROR] ${ruta}:${cAplicaciones.numeroLinea}: "${p}_aplicaciones" no admite "${TIPO_TODOS}": ` +
+            'para que aplique a cualquier tipo de aplicacion, borra la linea.'
+        );
+      }
+      if (idsDeTipo.has(a)) {
+        throw fallar(
+          `[ERROR] ${ruta}:${cAplicaciones.numeroLinea}: "${p}_aplicaciones" nombra "${a}", que es un tipo de lenguaje, no de aplicacion: ` +
+            `va en "${p}_tipos".`
+        );
+      }
+      if (!idsDeAplicacion.has(a)) {
+        throw fallar(
+          `[ERROR] ${ruta}:${cAplicaciones.numeroLinea}: "${p}_aplicaciones" nombra el tipo de aplicacion "${a}", que no existe. ` +
+            `Tipos de aplicacion validos: ${[...idsDeAplicacion].join(', ') || '(el catalogo no declara ninguno)'}.`
+        );
+      }
+    }
+  }
   const cMetodo = exigir(bloque, 'punto', n, 'metodo', ruta, fallar);
   const metodo = enumerado(cMetodo, `${p}_metodo`, METODOS, ruta, fallar);
   const cSonda = bloque.get('sonda');
@@ -293,7 +381,7 @@ function construirPunto(
       throw fallar(`[ERROR] ${ruta}:${cMetodo.numeroLinea}: "${p}_metodo: determinista" exige "${p}_sonda".`);
     }
     sonda = texto(cSonda, `${p}_sonda`, ruta, fallar);
-    if (!SONDAS_REGISTRADAS.includes(sonda)) {
+    if (!esSondaRegistrada(sonda)) {
       throw fallar(
         `[ERROR] ${ruta}:${cSonda.numeroLinea}: "${p}_sonda" vale "${sonda}", que no es una comprobacion registrada. ` +
           `Las que hay: ${SONDAS_REGISTRADAS.join(', ')}. Para algo distinto usa "${p}_metodo: juicio".`
@@ -306,7 +394,7 @@ function construirPunto(
   const descripcion = texto(exigir(bloque, 'punto', n, 'descripcion', ruta, fallar), `${p}_descripcion`, ruta, fallar);
   const cRef = bloque.get('referencia');
   const referencia = cRef === undefined ? null : texto(cRef, `${p}_referencia`, ruta, fallar);
-  return { id, severidad, tipos, metodo, sonda, arreglo, descripcion, referencia, origen };
+  return { id, severidad, tipos, aplicaciones, metodo, sonda, arreglo, descripcion, referencia, origen };
 }
 
 // ---------------------------------------------------------------------
@@ -340,9 +428,10 @@ export function parsearCatalogoDeploy(contenido: string, ruta: string): Catalogo
     pares,
     [
       { prefijo: 'tipo', campos: CAMPOS_TIPO },
+      { prefijo: 'aplicacion', campos: CAMPOS_APLICACION },
       { prefijo: 'punto', campos: CAMPOS_PUNTO },
     ],
-    ['total_tipos', 'total_puntos'],
+    ['total_tipos', 'total_aplicaciones', 'total_puntos'],
     ruta,
     fallar
   );
@@ -379,15 +468,61 @@ export function parsearCatalogoDeploy(contenido: string, ruta: string): Catalogo
     idsTipo.add(t.id);
   }
 
+  const aplicaciones = parsearAplicaciones(g, idsTipo, ruta, fallar);
+  const idsAplicacion = new Set(aplicaciones.map((a) => a.id));
+
   const puntos: PuntoCatalogo[] = [];
   const idsPunto = new Set<string>();
   for (let n = 1; n <= totalPuntos; n++) {
-    const p = construirPunto(bloquesPunto.get(n) as Bloque, n, ruta, 'plugin', idsTipo, fallar);
+    const p = construirPunto(bloquesPunto.get(n) as Bloque, n, ruta, 'plugin', idsTipo, idsAplicacion, fallar);
     if (idsPunto.has(p.id)) throw fallar(`[ERROR] ${ruta}: el punto "${p.id}" esta repetido.`);
     idsPunto.add(p.id);
     puntos.push(p);
   }
-  return { tipos, puntos };
+  return { tipos, aplicaciones, puntos };
+}
+
+/**
+ * Familia `aplicacion_N_*` (TASK-068). `total_aplicaciones` es opcional: sin el
+ * no puede haber ninguna entrada `aplicacion_N_*` (un catalogo antiguo sigue
+ * valiendo). Un id de aplicacion no puede coincidir con uno de tipo: los dos
+ * ejes se nombran en campos distintos y un id compartido seria ambiguo.
+ */
+function parsearAplicaciones(
+  g: Agrupado,
+  idsTipo: ReadonlySet<string>,
+  ruta: string,
+  fallar: (m: string) => Error
+): AplicacionCatalogo[] {
+  const bloques = g.bloques.get('aplicacion') as Map<number, Bloque>;
+  const parTotal = g.extras.get('total_aplicaciones');
+  const total = parTotal === undefined ? 0 : valorEntero(parTotal, 'total_aplicaciones', ruta, fallar);
+  if (exigirContiguos('aplicacion', bloques, ruta, fallar) !== total) {
+    throw fallar(
+      `[ERROR] ${ruta}: "total_aplicaciones" dice ${total}${parTotal === undefined ? ' (no esta)' : ''}, pero hay ${bloques.size} tipos de aplicacion. ` +
+        'Corrige el total o las entradas.'
+    );
+  }
+  const aplicaciones: AplicacionCatalogo[] = [];
+  const ids = new Set<string>();
+  for (let n = 1; n <= total; n++) {
+    const b = bloques.get(n) as Bloque;
+    const id = texto(exigir(b, 'aplicacion', n, 'id', ruta, fallar), `aplicacion_${n}_id`, ruta, fallar);
+    if (!ID_RE.test(id) || id === TIPO_TODOS) {
+      throw fallar(`[ERROR] ${ruta}: "aplicacion_${n}_id" vale "${id}"; usa minusculas, digitos y guiones, y no "${TIPO_TODOS}".`);
+    }
+    if (idsTipo.has(id)) {
+      throw fallar(`[ERROR] ${ruta}: "aplicacion_${n}_id" vale "${id}", que ya es un tipo de lenguaje (tipo_N_id). Usa otro id.`);
+    }
+    if (ids.has(id)) throw fallar(`[ERROR] ${ruta}: el tipo de aplicacion "${id}" esta repetido.`);
+    ids.add(id);
+    const nombre = b.has('nombre') ? texto(b.get('nombre') as Valor, `aplicacion_${n}_nombre`, ruta, fallar) : id;
+    const marcadores = lista(exigir(b, 'aplicacion', n, 'marcadores', ruta, fallar), `aplicacion_${n}_marcadores`, ruta, fallar);
+    const cContiene = b.get('contiene');
+    const contiene = cContiene === undefined ? null : lista(cContiene, `aplicacion_${n}_contiene`, ruta, fallar);
+    aplicaciones.push({ id, nombre, marcadores, contiene });
+  }
+  return aplicaciones;
 }
 
 // ---------------------------------------------------------------------
@@ -435,6 +570,7 @@ export function parsearCapaProyecto(contenido: string, ruta: string, base: Catal
 
   const idsBase = new Set(base.puntos.map((p) => p.id));
   const idsTipo = new Set(base.tipos.map((t) => t.id));
+  const idsAplicacion = new Set(base.aplicaciones.map((a) => a.id));
 
   // desactivar
   const bDes = g.bloques.get('desactivar') as Map<number, Bloque>;
@@ -459,7 +595,7 @@ export function parsearCapaProyecto(contenido: string, ruta: string, base: Catal
   const anadidos: PuntoCatalogo[] = [];
   const idsVistos = new Set<string>(idsBase);
   for (let n = 1; n <= nPun; n++) {
-    const p = construirPunto(bPun.get(n) as Bloque, n, ruta, 'proyecto', idsTipo, fallar);
+    const p = construirPunto(bPun.get(n) as Bloque, n, ruta, 'proyecto', idsTipo, idsAplicacion, fallar);
     if (idsVistos.has(p.id)) {
       throw fallar(
         `[ERROR] ${ruta}: el punto "${p.id}" ya existe ` +
@@ -513,8 +649,10 @@ export function parsearCapaProyecto(contenido: string, ruta: string, base: Catal
       }
     }
     // D3: un silencio es POR HALLAZGO. Sin commit solo vale para el arbol, y ahi se ata a la huella
-    // del valor: asi no tapa otra clave nueva del mismo patron en el mismo fichero.
-    if (commit === null && huella === null && patron !== 'fichero-secreto') {
+    // del valor: asi no tapa otra clave nueva del mismo patron en el mismo fichero. Los hallazgos
+    // que son del fichero entero (PATRONES_SIN_HUELLA: fichero-secreto, dockerfile-sin-user,
+    // pr-target-checkout) no tienen huella y valen con patron + fichero (TASK-068).
+    if (commit === null && huella === null && !PATRONES_SIN_HUELLA.includes(patron)) {
       throw fallar(
         `[ERROR] ${ruta}: silenciar_${n} exige "silenciar_${n}_commit" (hallazgo del historial) o "silenciar_${n}_huella" ` +
           '(hallazgo del arbol: la huella sale en la evidencia). Sin ninguno taparia tambien las claves nuevas del mismo fichero.'
@@ -538,5 +676,5 @@ export function combinarCatalogo(base: CatalogoBase, capa: CapaProyecto): Catalo
   const ids = new Set(puntos.map((p) => p.id));
   const desactivados = new Map<string, string>();
   for (const d of capa.desactivados) if (ids.has(d.id)) desactivados.set(d.id, d.motivo);
-  return { tipos: base.tipos, puntos, desactivados, silencios: capa.silencios, avisos: [...capa.avisos] };
+  return { tipos: base.tipos, aplicaciones: base.aplicaciones, puntos, desactivados, silencios: capa.silencios, avisos: [...capa.avisos] };
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-reglas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-reglas.ts
new file mode 100644
index 0000000..5bdd58c
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-reglas.ts
@@ -0,0 +1,829 @@
+/**
+ * Detectores puros de las sondas de configuracion de `taskctl doctor-deploy`
+ * (TASK-068, puntos 37 a 43 del catalogo). No tocan disco: reciben el CONJUNTO
+ * de ficheros ya leidos (ruta + contenido) y devuelven hallazgos. La lectura,
+ * los silencios y el estado del punto los pone `fs/sondas-deploy-config.ts`.
+ *
+ * Por que el conjunto y no fichero a fichero: el RLS de una tabla puede
+ * activarse en una migracion posterior a la que la crea.
+ *
+ * Reglas comunes:
+ * - Sin parser externo (cero dependencias): YAML, Dockerfile, SQL y reglas de
+ *   Firebase se leen linea a linea o con expresiones acotadas. Lo que se escapa
+ *   esta escrito en cada detector.
+ * - El valor de un secreto (contrasena del compose, token de .npmrc...) NUNCA
+ *   va en `descripcion`: solo enmascarado en `muestra` (la misma mascara que
+ *   `buscarSecretos`).
+ * - `huella` identifica el hallazgo para silenciarlo. En los secretos se
+ *   calcula sobre la CLAVE (nombre de la variable), nunca sobre el valor: una
+ *   contrasena debil se confirmaria con un diccionario. `null` = hallazgo por
+ *   fichero (se silencia con patron + fichero).
+ * - CRLF: todo se normaliza a `\n` antes de mirar.
+ */
+import { buscarSecretos, enmascarar, huellaDe } from './secretos.js';
+
+export interface FicheroLeido {
+  /** Ruta relativa a la raiz, con `/`. */
+  ruta: string;
+  contenido: string;
+}
+
+export interface HallazgoRegla {
+  /** Id estable del patron: lo que se usa para silenciar. */
+  patron: string;
+  fichero: string;
+  linea?: number;
+  /** Que se vio, en una frase. Nunca el valor de un secreto. */
+  descripcion: string;
+  /** Valor enmascarado (solo en los secretos). */
+  muestra?: string;
+  /** Huella para silenciar el hallazgo; null = por fichero. */
+  huella: string | null;
+  /**
+   * El mismo valor ya lo cuenta otra sonda (p. ej. `secretos-arbol (patron npm-token)`):
+   * se lista como nota y NO cuenta como FALLA aqui, para no dar dos FALLA por un token.
+   */
+  cubiertoPor?: string;
+}
+
+export type Detector = (ficheros: readonly FicheroLeido[]) => HallazgoRegla[];
+
+/** Ids de patron de los hallazgos de estos detectores (para silenciar). */
+export const PATRON = {
+  firebase: 'firebase-regla-abierta',
+  rls: 'tabla-sin-rls',
+  token: 'token-gestor',
+  compose: 'compose-contrasena',
+  prTarget: 'pr-target-checkout',
+  accion: 'accion-sin-sha',
+  sinUser: 'dockerfile-sin-user',
+  addUrl: 'dockerfile-add-url',
+} as const;
+
+/** Patrones cuyo hallazgo es del fichero entero (sin huella): se silencian con patron + fichero. */
+export const PATRONES_REGLAS_SIN_HUELLA: readonly string[] = [PATRON.prTarget, PATRON.sinUser];
+
+// ---------------------------------------------------------------------
+// Utilidades
+// ---------------------------------------------------------------------
+
+const normalizar = (t: string): string => t.replace(/\r\n?/g, '\n');
+
+/** Linea (1-based) de la posicion `indice`. */
+function lineaDe(texto: string, indice: number): number {
+  let n = 1;
+  for (let i = 0; i < indice && i < texto.length; i++) if (texto.charCodeAt(i) === 10) n++;
+  return n;
+}
+
+/** Sustituye por espacios todo menos los saltos de linea: conserva posiciones y lineas. */
+const blanquear = (s: string): string => s.replace(/[^\n]/g, ' ');
+
+const nombreBase = (ruta: string): string => ruta.slice(ruta.lastIndexOf('/') + 1);
+
+/** Quita comentarios `//` y `/* *\/` respetando las cadenas ('...' y "..."). */
+export function sinComentariosC(t: string): string {
+  let out = '';
+  let i = 0;
+  while (i < t.length) {
+    const c = t[i] as string;
+    const d = t[i + 1];
+    if (c === '"' || c === "'") {
+      let j = i + 1;
+      while (j < t.length && t[j] !== c && t[j] !== '\n') j += t[j] === '\\' ? 2 : 1;
+      out += t.slice(i, j + 1);
+      i = j + 1;
+      continue;
+    }
+    if (c === '/' && d === '/') {
+      let j = t.indexOf('\n', i);
+      if (j === -1) j = t.length;
+      out += blanquear(t.slice(i, j));
+      i = j;
+      continue;
+    }
+    if (c === '/' && d === '*') {
+      const fin = t.indexOf('*/', i + 2);
+      const j = fin === -1 ? t.length : fin + 2;
+      out += blanquear(t.slice(i, j));
+      i = j;
+      continue;
+    }
+    out += c;
+    i++;
+  }
+  return out;
+}
+
+/** Comentario YAML fuera de comillas: `#` al principio o tras un espacio. Aproximado (sin parser). */
+function sinComentarioYaml(linea: string): string {
+  let comilla: string | null = null;
+  for (let i = 0; i < linea.length; i++) {
+    const c = linea[i];
+    if (comilla !== null) {
+      if (c === comilla) comilla = null;
+      continue;
+    }
+    if (c === '"' || c === "'") comilla = c;
+    else if (c === '#' && (i === 0 || /\s/.test(linea[i - 1] as string))) return linea.slice(0, i);
+  }
+  return linea;
+}
+
+/** Quita comillas envolventes de un valor. */
+function sinComillas(v: string): string {
+  const t = v.trim();
+  if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) return t.slice(1, -1);
+  return t;
+}
+
+/** Si otra sonda (secretos-arbol) ya caza este valor como secreto, su patron. */
+function cubiertoPorSecretosArbol(valor: string): string | undefined {
+  const h = buscarSecretos(valor).find((x) => x.clase === 'secreto');
+  return h === undefined ? undefined : `secretos-arbol (patron ${h.patron})`;
+}
+
+// ---------------------------------------------------------------------
+// 37 reglas-firebase-abiertas
+// ---------------------------------------------------------------------
+
+/** Quita parentesis que envuelven TODA la expresion. */
+function quitarParentesis(c: string): string {
+  let t = c;
+  for (;;) {
+    if (!t.startsWith('(') || !t.endsWith(')')) return t;
+    let prof = 0;
+    let envuelve = true;
+    for (let i = 0; i < t.length; i++) {
+      if (t[i] === '(') prof++;
+      else if (t[i] === ')') prof--;
+      if (prof === 0 && i < t.length - 1) {
+        envuelve = false;
+        break;
+      }
+    }
+    if (!envuelve) return t;
+    t = t.slice(1, -1);
+  }
+}
+
+/**
+ * Por que una condicion de `allow` deja la regla abierta a cualquiera; null si no la deja.
+ * Sin condicion, `if true` (tambien `true || ...`) y el modo de prueba
+ * `request.time < timestamp.date(...)` (abierta a todos hasta esa fecha).
+ */
+export function condicionAbierta(cond: string | undefined): string | null {
+  if (cond === undefined) return 'sin condicion';
+  const c = quitarParentesis(cond.replace(/\s+/g, ''));
+  if (c === '') return 'sin condicion';
+  if (c.split('||').some((p) => quitarParentesis(p) === 'true')) return 'if true';
+  if (/^request\.time<timestamp\.date\(\d+,\d+,\d+\)$/.test(c)) return 'abierta a todos hasta una fecha (modo de prueba)';
+  return null;
+}
+
+const RE_FIRESTORE =
+  /\bmatch\s+(\S+)\s*\{|\ballow\s+([A-Za-z]+(?:\s*,\s*[A-Za-z]+)*)\s*(?::\s*if\b([^;}]*))?\s*(?:;|(?=\}))|\{|\}/g;
+
+function detectarReglasFirestore(f: FicheroLeido): HallazgoRegla[] {
+  const original = normalizar(f.contenido);
+  const t = sinComentariosC(original);
+  const pila: Array<string | null> = [];
+  const res: HallazgoRegla[] = [];
+  const re = new RegExp(RE_FIRESTORE.source, 'g');
+  let m: RegExpExecArray | null;
+  while ((m = re.exec(t)) !== null) {
+    if (m[1] !== undefined) pila.push(m[1]);
+    else if (m[2] !== undefined) {
+      const motivo = condicionAbierta(m[3]);
+      if (motivo === null) continue;
+      const ops = m[2].split(',').map((o) => o.trim()).filter((o) => o !== '').join(', ');
+      const ruta = pila.filter((x): x is string => x !== null).join('') || '(raiz)';
+      res.push({
+        patron: PATRON.firebase,
+        fichero: f.ruta,
+        linea: lineaDe(t, m.index),
+        descripcion: `regla abierta a cualquiera (${motivo}): allow ${ops} en match ${ruta}`,
+        huella: huellaDe(`${ruta}|${ops}|${(m[3] ?? '').replace(/\s+/g, '')}`),
+      });
+    } else if (m[0] === '{') pila.push(null);
+    else if (m[0] === '}') pila.pop();
+  }
+  return res;
+}
+
+const RE_REALTIME = /"\.(read|write)"\s*:\s*(?:true\b|"\s*true\s*")/g;
+
+/** Rutas (`/usuarios/$uid`) y operacion de cada `.read`/`.write` a true, en orden del texto. */
+function rutasAbiertasRealtime(o: unknown, ruta: string, res: Array<{ ruta: string; op: string }>): void {
+  if (typeof o !== 'object' || o === null || Array.isArray(o)) return;
+  for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
+    if (k === '.read' || k === '.write') {
+      if (v === true || (typeof v === 'string' && v.trim() === 'true')) res.push({ ruta: ruta || '/', op: k.slice(1) });
+    } else {
+      rutasAbiertasRealtime(v, k === 'rules' && ruta === '' ? '' : `${ruta}/${k}`, res);
+    }
+  }
+}
+
+function detectarReglasRealtime(f: FicheroLeido): HallazgoRegla[] {
+  const t = sinComentariosC(normalizar(f.contenido));
+  const apariciones: Array<{ op: string; linea: number }> = [];
+  const re = new RegExp(RE_REALTIME.source, 'g');
+  let m: RegExpExecArray | null;
+  while ((m = re.exec(t)) !== null) apariciones.push({ op: m[1] as string, linea: lineaDe(t, m.index) });
+  let rutas: Array<{ ruta: string; op: string }> | null = [];
+  try {
+    rutasAbiertasRealtime(JSON.parse(t), '', rutas);
+  } catch {
+    rutas = null; // no es JSON valido: se queda con lo que vio el texto
+  }
+  const casan = rutas !== null && rutas.length === apariciones.length && rutas.every((r, i) => r.op === apariciones[i]?.op);
+  return apariciones.map((a, i) => {
+    const ruta = casan && rutas !== null ? (rutas[i] as { ruta: string }).ruta : `(aparicion ${i + 1})`;
+    return {
+      patron: PATRON.firebase,
+      fichero: f.ruta,
+      linea: a.linea,
+      descripcion: `regla abierta a cualquiera: ".${a.op}": true en ${ruta}`,
+      huella: huellaDe(`${ruta}|${a.op}`),
+    };
+  });
+}
+
+/** Reglas de Firestore/Storage (`*.rules`) y de Realtime Database (`*.rules.json`). */
+export const detectarFirebaseAbierto: Detector = (ficheros) =>
+  ficheros.flatMap((f) => (f.ruta.toLowerCase().endsWith('.json') ? detectarReglasRealtime(f) : detectarReglasFirestore(f)));
+
+// ---------------------------------------------------------------------
+// 38 migraciones-sin-rls
+// ---------------------------------------------------------------------
+
+/** Esquemas internos de Supabase/PostgreSQL o privados por convencion: no se exponen por la API. */
+const ESQUEMAS_NO_EXPUESTOS = new Set([
+  'auth',
+  'storage',
+  'extensions',
+  'realtime',
+  'vault',
+  'graphql',
+  'graphql_public',
+  'supabase_functions',
+  'supabase_migrations',
+  'net',
+  'cron',
+  'pgsodium',
+  'pgsodium_masks',
+  'information_schema',
+  'private',
+  'internal',
+]);
+
+/** Quita comentarios SQL y vacia cadenas ('...') y cuerpos $$...$$, respetando "identificadores". */
+export function sinComentariosSql(t: string): string {
+  let out = '';
+  let i = 0;
+  while (i < t.length) {
+    const c = t[i] as string;
+    if (c === '-' && t[i + 1] === '-') {
+      let j = t.indexOf('\n', i);
+      if (j === -1) j = t.length;
+      out += blanquear(t.slice(i, j));
+      i = j;
+    } else if (c === '/' && t[i + 1] === '*') {
+      const fin = t.indexOf('*/', i + 2);
+      const j = fin === -1 ? t.length : fin + 2;
+      out += blanquear(t.slice(i, j));
+      i = j;
+    } else if (c === "'") {
+      let j = i + 1;
+      while (j < t.length) {
+        if (t[j] === "'" && t[j + 1] === "'") j += 2;
+        else if (t[j] === "'") break;
+        else j++;
+      }
+      out += blanquear(t.slice(i, j + 1));
+      i = j + 1;
+    } else if (c === '$') {
+      const m = /^\$([A-Za-z_]\w*)?\$/.exec(t.slice(i, i + 64));
+      if (m === null) {
+        out += c;
+        i++;
+        continue;
+      }
+      const fin = t.indexOf(m[0], i + m[0].length);
+      const j = fin === -1 ? t.length : fin + m[0].length;
+      out += blanquear(t.slice(i, j));
+      i = j;
+    } else if (c === '"') {
+      let j = i + 1;
+      while (j < t.length) {
+        if (t[j] === '"' && t[j + 1] === '"') j += 2;
+        else if (t[j] === '"') break;
+        else j++;
+      }
+      out += t.slice(i, j + 1);
+      i = j + 1;
+    } else {
+      out += c;
+      i++;
+    }
+  }
+  return out;
+}
+
+const ID_SQL = '(?:"(?:[^"]|"")+"|[A-Za-z_][\\w$]*)';
+const NOMBRE_SQL = `${ID_SQL}(?:\\s*\\.\\s*${ID_SQL})?`;
+const RE_PARTE_ID = /"((?:[^"]|"")+)"|([A-Za-z_][\w$]*)/g;
+
+/** `public."Users"` -> `{esquema: 'public', tabla: 'Users'}`; sin comillas, en minusculas; sin esquema, `public`. */
+export function nombreTablaSql(crudo: string): { esquema: string; tabla: string } {
+  const partes: string[] = [];
+  for (const m of crudo.matchAll(new RegExp(RE_PARTE_ID.source, 'g'))) {
+    partes.push(m[1] !== undefined ? m[1].replace(/""/g, '"') : (m[2] as string).toLowerCase());
+  }
+  if (partes.length >= 2) return { esquema: partes[0] as string, tabla: partes[1] as string };
+  return { esquema: 'public', tabla: partes[0] ?? '' };
+}
+
+function idSql(crudo: string): string {
+  const m = new RegExp(`^${ID_SQL}$`).exec(crudo.trim());
+  if (m === null) return crudo.trim().toLowerCase();
+  const t = m[0];
+  return t.startsWith('"') ? t.slice(1, -1).replace(/""/g, '"') : t.toLowerCase();
+}
+
+type EventoSql =
+  | { indice: number; tipo: 'create'; nombre: string }
+  | { indice: number; tipo: 'alter'; nombre: string; cuerpo: string }
+  | { indice: number; tipo: 'drop'; nombres: string[] };
+
+function eventosSql(t: string): EventoSql[] {
+  const ev: EventoSql[] = [];
+  const reCreate = new RegExp(
+    `\\bcreate\\s+(?:(?:global|local)\\s+)?((?:temporary|temp)\\s+)?(?:unlogged\\s+)?table\\s+(?:if\\s+not\\s+exists\\s+)?(${NOMBRE_SQL})`,
+    'gi'
+  );
+  for (const m of t.matchAll(reCreate)) {
+    if (m[1] !== undefined) continue; // temporal: no se expone
+    ev.push({ indice: m.index ?? 0, tipo: 'create', nombre: m[2] as string });
+  }
+  const reAlter = new RegExp(`\\balter\\s+table\\s+(?:if\\s+exists\\s+)?(?:only\\s+)?(${NOMBRE_SQL})\\s*\\*?([^;]*)`, 'gi');
+  for (const m of t.matchAll(reAlter)) ev.push({ indice: m.index ?? 0, tipo: 'alter', nombre: m[1] as string, cuerpo: m[2] as string });
+  const reDrop = new RegExp(`\\bdrop\\s+table\\s+(?:if\\s+exists\\s+)?(${NOMBRE_SQL}(?:\\s*,\\s*${NOMBRE_SQL})*)`, 'gi');
+  for (const m of t.matchAll(reDrop)) {
+    const nombres = [...(m[1] as string).matchAll(new RegExp(NOMBRE_SQL, 'g'))].map((x) => x[0]);
+    ev.push({ indice: m.index ?? 0, tipo: 'drop', nombres });
+  }
+  return ev.sort((a, b) => a.indice - b.indice);
+}
+
+/**
+ * Tablas creadas en las migraciones de Supabase que no tienen RLS activado en NINGUNA
+ * migracion del conjunto. Se recorren en orden de nombre (las migraciones llevan la
+ * fecha delante): `create` la anade, `alter ... enable/disable row level security` la
+ * marca, `rename to` y `set schema` la mueven, `drop` la quita.
+ */
+export const detectarTablasSinRls: Detector = (ficheros) => {
+  const tablas = new Map<string, { rls: boolean; fichero: string; linea: number; mostrar: string; esquema: string }>();
+  const clave = (n: { esquema: string; tabla: string }): string => `${n.esquema}\u0000${n.tabla}`;
+  const ordenados = [...ficheros].sort((a, b) => (a.ruta < b.ruta ? -1 : a.ruta > b.ruta ? 1 : 0));
+  for (const f of ordenados) {
+    const t = sinComentariosSql(normalizar(f.contenido));
+    for (const e of eventosSql(t)) {
+      if (e.tipo === 'create') {
+        const n = nombreTablaSql(e.nombre);
+        if (!tablas.has(clave(n))) {
+          tablas.set(clave(n), { rls: false, fichero: f.ruta, linea: lineaDe(t, e.indice), mostrar: `${n.esquema}.${n.tabla}`, esquema: n.esquema });
+        }
+      } else if (e.tipo === 'drop') {
+        for (const x of e.nombres) tablas.delete(clave(nombreTablaSql(x)));
+      } else {
+        const n = nombreTablaSql(e.nombre);
+        const actual = tablas.get(clave(n));
+        if (actual === undefined) continue;
+        if (/\benable\s+row\s+level\s+security\b/i.test(e.cuerpo)) actual.rls = true;
+        if (/\bdisable\s+row\s+level\s+security\b/i.test(e.cuerpo)) actual.rls = false;
+        const ren = new RegExp(`\\brename\\s+to\\s+(${ID_SQL})`, 'i').exec(e.cuerpo);
+        const esq = new RegExp(`\\bset\\s+schema\\s+(${ID_SQL})`, 'i').exec(e.cuerpo);
+        if (ren !== null || esq !== null) {
+          const nuevo = { esquema: esq !== null ? idSql(esq[1] as string) : n.esquema, tabla: ren !== null ? idSql(ren[1] as string) : n.tabla };
+          tablas.delete(clave(n));
+          tablas.set(clave(nuevo), { ...actual, mostrar: `${nuevo.esquema}.${nuevo.tabla}`, esquema: nuevo.esquema });
+        }
+      }
+    }
+  }
+  const res: HallazgoRegla[] = [];
+  for (const [k, v] of tablas) {
+    if (v.rls || ESQUEMAS_NO_EXPUESTOS.has(v.esquema) || v.esquema.startsWith('pg_')) continue;
+    res.push({
+      patron: PATRON.rls,
+      fichero: v.fichero,
+      linea: v.linea,
+      descripcion: `la tabla ${v.mostrar} se crea sin activar RLS en ninguna migracion (alter table ... enable row level security)`,
+      huella: huellaDe(k),
+    });
+  }
+  return res;
+};
+
+// ---------------------------------------------------------------------
+// 39 tokens-en-ficheros-de-gestor
+// ---------------------------------------------------------------------
+
+function hallazgoToken(f: FicheroLeido, linea: number, clave: string, valor: string): HallazgoRegla {
+  const h: HallazgoRegla = {
+    patron: PATRON.token,
+    fichero: f.ruta,
+    linea,
+    descripcion: `credencial literal en ${nombreBase(f.ruta)} (clave ${clave})`,
+    muestra: enmascarar(valor),
+    huella: huellaDe(`${PATRON.token}|${clave}`),
+  };
+  const cubierto = cubiertoPorSecretosArbol(valor);
+  if (cubierto !== undefined) h.cubiertoPor = cubierto;
+  return h;
+}
+
+/** Un valor es interpolado (no literal) si lleva `${...}` o `%(...)`. */
+const esInterpolado = (v: string): boolean => v.includes('${') || v.includes('%(');
+
+function tokensNpmrc(f: FicheroLeido): HallazgoRegla[] {
+  const res: HallazgoRegla[] = [];
+  normalizar(f.contenido)
+    .split('\n')
+    .forEach((l, i) => {
+      if (/^\s*[#;]/.test(l)) return;
+      const m = /^\s*([^=\s][^=]*?)\s*=\s*(.*?)\s*$/.exec(l);
+      if (m === null) return;
+      const clave = m[1] as string;
+      if (!/(?:^|:)_(?:authtoken|auth|password)$/i.test(clave)) return;
+      const valor = sinComillas(m[2] as string);
+      if (valor === '' || esInterpolado(valor)) return;
+      res.push(hallazgoToken(f, i + 1, clave, valor));
+    });
+  return res;
+}
+
+function tokensPypirc(f: FicheroLeido): HallazgoRegla[] {
+  const res: HallazgoRegla[] = [];
+  let seccion = '';
+  normalizar(f.contenido)
+    .split('\n')
+    .forEach((l, i) => {
+      if (/^\s*[#;]/.test(l)) return;
+      const s = /^\s*\[([^\]]+)\]/.exec(l);
+      if (s !== null) {
+        seccion = (s[1] as string).trim();
+        return;
+      }
+      const m = /^\s*(password)\s*[=:]\s*(.*?)\s*$/i.exec(l);
+      if (m === null) return;
+      const valor = sinComillas(m[2] as string);
+      if (valor === '' || esInterpolado(valor)) return;
+      res.push(hallazgoToken(f, i + 1, `[${seccion}] password`, valor));
+    });
+  return res;
+}
+
+function tokensSettingsXml(f: FicheroLeido): HallazgoRegla[] {
+  const t = normalizar(f.contenido).replace(/<!--[\s\S]*?-->/g, blanquear);
+  if (!/<settings\b/.test(t)) return []; // un settings.xml que no es de Maven
+  const res: HallazgoRegla[] = [];
+  for (const m of t.matchAll(/<(password|passphrase)>([\s\S]*?)<\/\1>/gi)) {
+    const valor = (m[2] as string).trim();
+    // `${env.X}` no es literal; `{...}` es una contrasena cifrada con la maestra de Maven.
+    if (valor === '' || esInterpolado(valor) || /^\{[^}]*\}$/.test(valor)) continue;
+    const indice = m.index ?? 0;
+    const inicioServer = t.lastIndexOf('<server>', indice);
+    const finServer = t.lastIndexOf('</server>', indice);
+    let donde = '';
+    if (inicioServer !== -1 && inicioServer > finServer) {
+      const id = /<id>\s*([^<]*?)\s*<\/id>/.exec(t.slice(inicioServer, indice));
+      donde = id !== null ? `server ${id[1] as string} ` : 'server ';
+    }
+    res.push(hallazgoToken(f, lineaDe(t, indice), `${donde}<${(m[1] as string).toLowerCase()}>`, valor));
+  }
+  return res;
+}
+
+/**
+ * Credenciales literales en `.npmrc` (`_authToken`, `_auth`, `_password`, con o sin
+ * registro delante), `.pypirc` (`password`) y `settings.xml` de Maven (`<password>`,
+ * `<passphrase>`). No cuentan `${NPM_TOKEN}`, `${env.X}`, `%(x)s` ni las cifradas `{...}`.
+ */
+export const detectarTokensGestor: Detector = (ficheros) =>
+  ficheros.flatMap((f) => {
+    const base = nombreBase(f.ruta);
+    if (base === '.npmrc') return tokensNpmrc(f);
+    if (base === '.pypirc') return tokensPypirc(f);
+    if (base === 'settings.xml') return tokensSettingsXml(f);
+    return [];
+  });
+
+// ---------------------------------------------------------------------
+// 40 compose-con-contrasenas
+// ---------------------------------------------------------------------
+
+const CLAVE_SECRETA = /(?:^|_)(?:password|passwd|pass|pwd|secret|token|api_?key|access_?key|private_?key)$/i;
+const CLAVE_NO_SECRETA = /allow_empty|random_root|_file$/i;
+const VALOR_NO_CONTRASENA = /^(?:true|false|yes|no|on|off|null|~|<[^>]*>|\*+)$/i;
+
+/** El valor de una clave del compose, si es una contrasena literal; null si no lo es. */
+export function contrasenaLiteralCompose(clave: string, crudo: string): string | null {
+  if (!CLAVE_SECRETA.test(clave) || CLAVE_NO_SECRETA.test(clave)) return null;
+  const t = crudo.trim();
+  // Bloques (| >), anclas y alias (& *), y mapas o listas en linea: no se leen.
+  if (t === '' || /^[|>&*{[]/.test(t)) return null;
+  const v = sinComillas(t);
+  if (v === '' || v.includes('$') || VALOR_NO_CONTRASENA.test(v)) return null;
+  return v;
+}
+
+/**
+ * Contrasenas y tokens literales en `docker-compose*.yml` / `compose*.yaml`: en forma
+ * de mapa (`POSTGRES_PASSWORD: x`) y de lista (`- POSTGRES_PASSWORD=x`). No cuentan
+ * `${X}`, `$X`, las claves `*_FILE` (secretos de Docker) ni los valores booleanos.
+ */
+export const detectarContrasenasCompose: Detector = (ficheros) =>
+  ficheros.flatMap((f) => {
+    const res: HallazgoRegla[] = [];
+    normalizar(f.contenido)
+      .split('\n')
+      .forEach((bruta, i) => {
+        if (/^\s*#/.test(bruta)) return;
+        const l = sinComentarioYaml(bruta);
+        let clave: string | undefined;
+        let crudo: string | undefined;
+        const lista = /^\s*-\s*(["']?)([A-Za-z_][A-Za-z0-9_.-]*)=(.*?)\1\s*$/.exec(l);
+        if (lista !== null) {
+          clave = lista[2];
+          crudo = lista[3];
+        } else {
+          const mapa = /^\s*(?:-\s*)?["']?([A-Za-z_][A-Za-z0-9_.-]*)["']?\s*:(?:\s+(.*)|\s*)$/.exec(l);
+          if (mapa !== null) {
+            clave = mapa[1];
+            crudo = mapa[2] ?? '';
+          }
+        }
+        if (clave === undefined || crudo === undefined) return;
+        const valor = contrasenaLiteralCompose(clave, crudo);
+        if (valor === null) return;
+        const h: HallazgoRegla = {
+          patron: PATRON.compose,
+          fichero: f.ruta,
+          linea: i + 1,
+          descripcion: `contrasena o token literal en la variable ${clave}`,
+          muestra: enmascarar(valor),
+          huella: huellaDe(`${PATRON.compose}|${clave}`),
+        };
+        const cubierto = cubiertoPorSecretosArbol(valor);
+        if (cubierto !== undefined) h.cubiertoPor = cubierto;
+        res.push(h);
+      });
+    return res;
+  });
+
+// ---------------------------------------------------------------------
+// 41 ci-pull-request-target
+// ---------------------------------------------------------------------
+
+const RE_EVENTO_PR_TARGET = /(?:^|[\s[,{'"])pull_request_target(?=$|[\s\]:,}'"])/m;
+const RE_CODIGO_PR =
+  /github\.event\.pull_request\.head\.(?:sha|ref|repo)|github\.head_ref|refs\/pull\/|github\.event\.pull_request\.merge_commit_sha|github\.event\.pull_request\.number|github\.event\.number/;
+
+/** true si el flujo se dispara con `pull_request_target` (bloque, escalar o lista en linea `[...]`). */
+export function usaPullRequestTarget(contenido: string): boolean {
+  const t = normalizar(contenido).split('\n').map(sinComentarioYaml).join('\n');
+  return RE_EVENTO_PR_TARGET.test(t);
+}
+
+/**
+ * Flujos con `pull_request_target` que traen el codigo del PR: `ref:` con
+ * `github.event.pull_request.head.sha|ref`, `github.head_ref` o `refs/pull/...`, o un
+ * `gh pr checkout` / `git fetch|checkout ... pull/...` en un `run`.
+ */
+export const detectarPullRequestTarget: Detector = (ficheros) =>
+  ficheros.flatMap((f) => {
+    if (!usaPullRequestTarget(f.contenido)) return [];
+    const res: HallazgoRegla[] = [];
+    normalizar(f.contenido)
+      .split('\n')
+      .forEach((bruta, i) => {
+        const l = sinComentarioYaml(bruta);
+        let que: string | null = null;
+        const expr = RE_CODIGO_PR.exec(l);
+        if (/^\s*(?:-\s*)?ref\s*:/.test(l) && expr !== null) que = `ref: ${expr[0]}`;
+        else if (/\bgh\s+pr\s+checkout\b/.test(l)) que = 'gh pr checkout';
+        else if (/\bgit\s+(?:fetch|checkout|pull)\b/.test(l) && (expr !== null || /\bpull\/\S+/.test(l))) que = 'git fetch/checkout del PR';
+        if (que === null) return;
+        res.push({
+          patron: PATRON.prTarget,
+          fichero: f.ruta,
+          linea: i + 1,
+          descripcion: `el flujo se dispara con pull_request_target y trae el codigo del PR (${que}): ejecuta codigo ajeno con secretos y permisos de escritura`,
+          huella: null,
+        });
+      });
+    return res;
+  });
+
+// ---------------------------------------------------------------------
+// 42 acciones-ci-sin-sha
+// ---------------------------------------------------------------------
+
+/** Organizaciones de GitHub: sus acciones no se cuentan como de terceros. */
+const ORGANIZACIONES_PROPIAS = new Set(['actions', 'github']);
+
+/**
+ * Que le pasa a un `uses:`: null si esta bien o no es de terceros (local `./`,
+ * `docker://`, `actions/*`, `github/*`, fijada a un SHA de 40 hex), o la razon.
+ */
+export function problemaUses(ref: string): string | null {
+  if (ref.startsWith('./') || ref.startsWith('../') || ref.startsWith('docker://') || ref.includes('${{')) return null;
+  const propietario = (ref.split('/')[0] ?? '').toLowerCase();
+  if (ORGANIZACIONES_PROPIAS.has(propietario)) return null;
+  const arroba = ref.lastIndexOf('@');
+  if (arroba === -1) return 'sin version: usa la rama por defecto';
+  const version = ref.slice(arroba + 1);
+  if (/^[0-9a-f]{40}$/i.test(version)) return null;
+  return `fijada a "${version}" (etiqueta o rama movil), no a un SHA de 40 caracteres`;
+}
+
+export const detectarAccionesSinSha: Detector = (ficheros) =>
+  ficheros.flatMap((f) => {
+    const res: HallazgoRegla[] = [];
+    normalizar(f.contenido)
+      .split('\n')
+      .forEach((bruta, i) => {
+        const m = /^\s*(?:-\s*)?uses\s*:\s*["']?([^\s"'#]+)/.exec(sinComentarioYaml(bruta));
+        if (m === null) return;
+        const ref = m[1] as string;
+        const problema = problemaUses(ref);
+        if (problema === null) return;
+        res.push({
+          patron: PATRON.accion,
+          fichero: f.ruta,
+          linea: i + 1,
+          descripcion: `accion de terceros ${ref} ${problema}`,
+          huella: huellaDe(ref),
+        });
+      });
+    return res;
+  });
+
+// ---------------------------------------------------------------------
+// 43 dockerfile-sin-user
+// ---------------------------------------------------------------------
+
+interface Instruccion {
+  palabra: string;
+  args: string;
+  linea: number;
+}
+
+/**
+ * Instrucciones de un Dockerfile: une las lineas con `\` (o el caracter de la
+ * directiva `# escape=`) al final, salta comentarios (tambien dentro de una
+ * continuacion) y los cuerpos de los heredoc (`RUN <<EOF`).
+ */
+export function instruccionesDockerfile(contenido: string): Instruccion[] {
+  const lineas = normalizar(contenido).split('\n');
+  let escape = '\\';
+  for (const l of lineas) {
+    const d = /^\s*#\s*([a-z]+)\s*=\s*(\S+)\s*$/i.exec(l);
+    if (d === null) break; // las directivas solo valen al principio
+    if ((d[1] as string).toLowerCase() === 'escape') escape = (d[2] as string)[0] ?? '\\';
+  }
+  const res: Instruccion[] = [];
+  let actual = '';
+  let inicio = 0;
+  let heredoc: string | null = null;
+  for (let i = 0; i < lineas.length; i++) {
+    const l = lineas[i] as string;
+    if (heredoc !== null) {
+      if (l.trim() === heredoc) heredoc = null;
+      continue;
+    }
+    const recortada = l.trim();
+    if (recortada.startsWith('#')) continue;
+    if (actual === '' && recortada === '') continue;
+    if (actual === '') inicio = i + 1;
+    const sinFin = l.replace(/\s+$/, '');
+    if (sinFin.endsWith(escape)) {
+      actual += `${sinFin.slice(0, -1)} `;
+      continue;
+    }
+    actual += l;
+    const m = /^\s*([A-Za-z]+)\s*([\s\S]*)$/.exec(actual);
+    if (m !== null) {
+      res.push({ palabra: (m[1] as string).toUpperCase(), args: (m[2] as string).trim(), linea: inicio });
+      const hd = /<<-?\s*["']?([A-Za-z_][\w]*)["']?/.exec(m[2] as string);
+      if (hd !== null) heredoc = hd[1] as string;
+    }
+    actual = '';
+  }
+  return res;
+}
+
+interface Etapa {
+  imagen: string;
+  alias: string | null;
+  usuario: string | null;
+  linea: number;
+}
+
+/** URL sin usuario, contrasena, query ni fragmento (puede llevar un token). */
+function urlSegura(u: string): string {
+  try {
+    const url = new URL(u);
+    return `${url.protocol}//${url.host}${url.pathname}`;
+  } catch {
+    return 'URL';
+  }
+}
+
+function argumentos(args: string): string[] {
+  if (args.startsWith('[')) {
+    try {
+      const v: unknown = JSON.parse(args);
+      if (Array.isArray(v)) return v.map(String);
+    } catch {
+      // forma de shell
+    }
+  }
+  return args.split(/\s+/).filter((x) => x !== '');
+}
+
+const ES_ROOT = /^(?:root|0)(?::(?:root|0))?$/i;
+
+/**
+ * Dockerfile cuya ETAPA FINAL corre como root (sin USER, heredado de la etapa en que
+ * se basa si es `FROM <alias>`, o `USER root|0`), salvo imagenes base `*nonroot*`
+ * (distroless); y `ADD <url>` sin `--checksum`.
+ */
+export const detectarDockerfile: Detector = (ficheros) =>
+  ficheros.flatMap((f) => {
+    const res: HallazgoRegla[] = [];
+    const etapas: Etapa[] = [];
+    for (const ins of instruccionesDockerfile(f.contenido)) {
+      if (ins.palabra === 'FROM') {
+        const t = argumentos(ins.args).filter((x) => !x.startsWith('--'));
+        const alias = (t[1] ?? '').toLowerCase() === 'as' && t[2] !== undefined ? t[2].toLowerCase() : null;
+        etapas.push({ imagen: t[0] ?? '', alias, usuario: null, linea: ins.linea });
+      } else if (ins.palabra === 'USER') {
+        const e = etapas[etapas.length - 1];
+        if (e !== undefined) e.usuario = argumentos(ins.args)[0] ?? '';
+      } else if (ins.palabra === 'ADD') {
+        const t = argumentos(ins.args);
+        if (t.some((x) => /^--checksum=/i.test(x))) continue;
+        const fuentes = t.filter((x) => !x.startsWith('--')).slice(0, -1);
+        for (const u of fuentes.filter((x) => /^https?:\/\//i.test(x))) {
+          const segura = urlSegura(u);
+          res.push({
+            patron: PATRON.addUrl,
+            fichero: f.ruta,
+            linea: ins.linea,
+            descripcion: `ADD descarga una URL remota (${segura}) sin --checksum: no se verifica lo que entra en la imagen`,
+            huella: huellaDe(segura),
+          });
+        }
+      }
+    }
+    const final = etapas[etapas.length - 1];
+    if (final === undefined) {
+      res.push({ patron: PATRON.sinUser, fichero: f.ruta, descripcion: 'el Dockerfile no tiene ninguna instruccion FROM ni USER', huella: null });
+      return res;
+    }
+    // USER efectivo de la etapa final: el suyo, o el de la etapa en que se basa (FROM <alias>).
+    let e: Etapa = final;
+    let usuario: string | null = final.usuario;
+    for (let saltos = 0; usuario === null && saltos < etapas.length; saltos++) {
+      const anteriores = etapas.slice(0, etapas.indexOf(e)).reverse();
+      const objetivo = e.imagen.toLowerCase();
+      const base = anteriores.find((x) => x.alias !== null && x.alias === objetivo);
+      if (base === undefined) break;
+      e = base;
+      usuario = base.usuario;
+    }
+    if (usuario === null) {
+      if (!/nonroot/i.test(e.imagen)) {
+        res.push({
+          patron: PATRON.sinUser,
+          fichero: f.ruta,
+          linea: final.linea,
+          descripcion: `la etapa final (FROM ${final.imagen}) no declara USER: el contenedor corre como root`,
+          huella: null,
+        });
+      }
+    } else if (ES_ROOT.test(usuario)) {
+      res.push({
+        patron: PATRON.sinUser,
+        fichero: f.ruta,
+        linea: final.linea,
+        descripcion: `la etapa final (FROM ${final.imagen}) corre como USER ${usuario}`,
+        huella: null,
+      });
+    }
+    return res;
+  });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy.ts
index f6223aa..7448dbd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy.ts
@@ -11,8 +11,8 @@
  * - `no-verificado`: no se pudo comprobar (falta una herramienta, o el punto
  *   pide juicio). Dice que falta. NO cambia el codigo de salida, pero el
  *   resumen cuenta cuantos puntos quedaron sin verificar.
- * - `no-aplica`: el punto no corresponde a los tipos detectados (o el
- *   proyecto lo desactivo). Dice por que.
+ * - `no-aplica`: el punto no corresponde a los tipos detectados, de lenguaje
+ *   o de aplicacion (o el proyecto lo desactivo). Dice por que.
  *
  * `Evidencia` NO tiene campo para el valor crudo de un secreto: lo enmascara
  * quien la crea. El enmascarado de la salida final (segunda red) lo aplica el
@@ -67,9 +67,26 @@ export interface TipoDetectado {
   rutas: string[];
 }
 
+/** Fichero marcador que decidio un tipo de aplicacion (TASK-068). */
+export interface MarcadorAplicacion {
+  /** Ruta relativa a la raiz del repo. */
+  fichero: string;
+  /** El texto del catalogo que se encontro dentro del fichero; null si bastaba con que existiera. */
+  contiene: string | null;
+}
+
+/** Tipo de aplicacion detectado (web, api, cli...): el segundo eje, aparte de `tipos` (TASK-068). */
+export interface AplicacionDetectada extends TipoDetectado {
+  /** Los ficheros que lo decidieron, ordenados (como mucho unos pocos). */
+  marcadores: MarcadorAplicacion[];
+}
+
 export interface InformeDeploy {
-  /** Version del formato del JSON. v2 (TASK-067): `origen` por punto y `veredictos`. */
-  version: 2;
+  /**
+   * Version del formato del JSON. v2 (TASK-067): `origen` por punto y `veredictos`.
+   * v3 (TASK-068): `aplicaciones` (tipo de aplicacion detectado, con sus marcadores).
+   */
+  version: 3;
   comando: 'doctor-deploy';
   /** Fecha y hora de la ejecucion (ISO 8601 UTC). */
   fecha: string;
@@ -78,6 +95,8 @@ export interface InformeDeploy {
   /** true si habia cambios sin commitear al ejecutar. */
   arbolSucio: boolean;
   tipos: TipoDetectado[];
+  /** Tipos de aplicacion detectados; vacio si ninguno (entonces ningun punto sale NO APLICA por este eje). */
+  aplicaciones: AplicacionDetectada[];
   avisos: string[];
   puntos: ResultadoPunto[];
   /** Resumen de los veredictos del agente; null si no se paso `--resultado`. */
@@ -158,6 +177,18 @@ function textoTipos(tipos: readonly TipoDetectado[]): string {
   return tipos.map((t) => `${t.nombre} (${t.rutas.join(', ')})`).join('; ');
 }
 
+/** Un marcador de aplicacion en texto: `package.json contiene "bin"`, o solo la ruta. */
+export function textoMarcadorAplicacion(m: MarcadorAplicacion): string {
+  if (m.contiene === null) return m.fichero;
+  // Los textos del catalogo que ya llevan comillas (`"bin"`) se muestran tal cual.
+  return `${m.fichero} contiene ${m.contiene.startsWith('"') ? m.contiene : `"${m.contiene}"`}`;
+}
+
+function textoAplicaciones(apps: readonly AplicacionDetectada[]): string {
+  if (apps.length === 0) return 'ninguna (sin marcadores de tipo de aplicacion: los puntos que dependen de el aplican)';
+  return apps.map((a) => `${a.nombre} [${a.id}] (${a.marcadores.map(textoMarcadorAplicacion).join('; ')})`).join('; ');
+}
+
 /** Las tareas de `--crear-tareas` en texto: lo creado, lo reutilizado (y se dice) y las huerfanas. */
 export function lineasTareas(t: ResumenTareas): string[] {
   const l: string[] = [];
@@ -180,6 +211,7 @@ export function formatearTexto(informe: InformeDeploy): string {
   l.push('taskctl doctor-deploy');
   l.push(`Commit: ${informe.commit ?? '(sin commits)'}   Rama: ${informe.rama ?? '(desconocida)'}${informe.arbolSucio ? '   ARBOL SUCIO: lo comprobado puede no ser lo publicado' : ''}`);
   l.push(`Tipos detectados: ${textoTipos(informe.tipos)}`);
+  l.push(`Aplicacion detectada: ${textoAplicaciones(informe.aplicaciones)}`);
   for (const a of informe.avisos) l.push(`[AVISO] ${a}`);
   l.push('');
   for (const p of informe.puntos) {
@@ -211,7 +243,7 @@ export function formatearTexto(informe: InformeDeploy): string {
   return `${l.join('\n')}\n`;
 }
 
-/** Una sola linea de JSON (v2, TASK-067). */
+/** Una sola linea de JSON (v3, TASK-068). */
 export function formatearJson(informe: InformeDeploy): string {
   const resumen = resumir(informe.puntos);
   return `${JSON.stringify({ ...informe, resumen, codigo: codigoSalida(informe.puntos) })}\n`;
@@ -239,6 +271,7 @@ export function formatearInforme(informe: InformeDeploy): string {
     `- Arbol de trabajo: ${informe.arbolSucio ? 'SUCIO (habia cambios sin commitear: este informe puede no describir lo que se publica)' : 'limpio'}`
   );
   l.push(`- Tipos detectados: ${textoTipos(informe.tipos)}`);
+  l.push(`- Aplicacion detectada: ${textoAplicaciones(informe.aplicaciones)}`);
   l.push(`- ${textoResumen(r)}`);
   l.push(`- Codigo de salida: ${codigoSalida(informe.puntos)}`);
   if (informe.tareas !== null) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-app.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-app.ts
index 84c0596..9ac00ee 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-app.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/deteccion-app.ts
@@ -7,8 +7,10 @@
  * versionar que no estan ignorados), hasta una profundidad fija, sin mirar
  * dentro de las carpetas de dependencias ni de build.
  */
-import type { TipoApp } from '../core/doctor-deploy-catalogo.js';
-import type { TipoDetectado } from '../core/doctor-deploy.js';
+import { readFileSync, statSync } from 'node:fs';
+import path from 'node:path';
+import type { AplicacionCatalogo, TipoApp } from '../core/doctor-deploy-catalogo.js';
+import type { AplicacionDetectada, MarcadorAplicacion, TipoDetectado } from '../core/doctor-deploy.js';
 import { gitTexto } from './git-crudo.js';
 
 /** Carpetas que ni se detectan ni se escanean: dependencias y build. */
@@ -83,3 +85,71 @@ export function detectarTipos(archivos: readonly string[], tipos: readonly TipoA
   }
   return detectados;
 }
+
+// ---------------------------------------------------------------------
+// Tipo de aplicacion (TASK-068): el segundo eje
+// ---------------------------------------------------------------------
+
+/** Un fichero marcador mayor que esto no se lee para buscar `contiene` (y no cuenta). */
+export const MAX_BYTES_MARCADOR_APLICACION = 1024 * 1024;
+
+/** Marcadores que se guardan por tipo de aplicacion detectado (para el informe). */
+const MAX_MARCADORES_POR_APLICACION = 5;
+
+/**
+ * Detecta los tipos de aplicacion (web, api, cli...) con los mismos marcadores
+ * y la misma profundidad que `detectarTipos`. Si el tipo declara `contiene`,
+ * el fichero marcador solo cuenta si su contenido incluye alguno de esos
+ * textos (sin distinguir mayusculas); solo entonces se lee, y solo los
+ * ficheros marcador. Un fichero ilegible o mayor que el tope no cuenta: sin
+ * deteccion, los puntos que dependen del tipo de aplicacion siguen aplicando
+ * (fallo en abierto).
+ *
+ * Por que no hace falta mas profundidad para React Native o Flutter: su
+ * `AndroidManifest.xml` esta en android/app/src/main/ (4 carpetas), pero se
+ * detectan por su manifiesto de raiz (`package.json` con `react-native`,
+ * `pubspec.yaml` con `sdk: flutter`), y Android por `android/app/build.gradle`
+ * con `com.android.application`.
+ */
+export function detectarAplicaciones(
+  cwd: string,
+  archivos: readonly string[],
+  aplicaciones: readonly AplicacionCatalogo[]
+): AplicacionDetectada[] {
+  const candidatos = archivos.filter((r) => profundidad(r) <= PROFUNDIDAD_MARCADORES);
+  const contenidos = new Map<string, string | null>();
+  const leer = (ruta: string): string | null => {
+    if (contenidos.has(ruta)) return contenidos.get(ruta) as string | null;
+    let t: string | null = null;
+    try {
+      const abs = path.join(cwd, ...ruta.split('/'));
+      const st = statSync(abs);
+      if (st.isFile() && st.size <= MAX_BYTES_MARCADOR_APLICACION) t = readFileSync(abs, 'utf8').toLowerCase();
+    } catch {
+      t = null;
+    }
+    contenidos.set(ruta, t);
+    return t;
+  };
+
+  const detectadas: AplicacionDetectada[] = [];
+  for (const a of aplicaciones) {
+    const marcadores: MarcadorAplicacion[] = [];
+    for (const r of candidatos) {
+      if (!a.marcadores.some((m) => coincideMarcador(r, m))) continue;
+      if (a.contiene === null) {
+        marcadores.push({ fichero: r, contiene: null });
+        continue;
+      }
+      const t = leer(r);
+      if (t === null) continue;
+      const texto = a.contiene.find((c) => t.includes(c.toLowerCase()));
+      if (texto !== undefined) marcadores.push({ fichero: r, contiene: texto });
+    }
+    if (marcadores.length === 0) continue;
+    marcadores.sort((x, y) => (x.fichero < y.fichero ? -1 : x.fichero > y.fichero ? 1 : 0));
+    const rutas = [...new Set(marcadores.map((m) => carpetaDe(m.fichero)))].sort();
+    detectadas.push({ id: a.id, nombre: a.nombre, rutas, marcadores: marcadores.slice(0, MAX_MARCADORES_POR_APLICACION) });
+  }
+  return detectadas;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy-config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy-config.ts
new file mode 100644
index 0000000..11b9cb6
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy-config.ts
@@ -0,0 +1,248 @@
+/**
+ * Las siete sondas de configuracion de `taskctl doctor-deploy` (TASK-068, puntos
+ * 37 a 43): reglas de Firebase, RLS en migraciones de Supabase, tokens en
+ * ficheros de gestores de paquetes, contrasenas en docker-compose,
+ * `pull_request_target`, acciones de CI sin SHA y Dockerfile sin USER.
+ *
+ * Todas tienen la misma forma (`sondaPorFicheros`): eligen ficheros por nombre
+ * entre los VERSIONADOS (lo que se publica), los leen, pasan el conjunto a un
+ * detector puro de `core/doctor-deploy-reglas.ts`, aplican los silencios y
+ * deciden el estado:
+ * - Ningun fichero que revisar: NO APLICA con el motivo (decision de la
+ *   persona en TASK-068; las seis sondas anteriores conservan su convencion).
+ * - Un fichero ilegible, binario o mayor que `maxBytesFichero`: NO VERIFICADO,
+ *   nunca un salto en silencio hacia OK.
+ * - Un hallazgo sin silenciar: FALLA. El valor de un secreto nunca va en la
+ *   evidencia ni en el motivo: solo la muestra enmascarada.
+ *
+ * Las sondas son declaraciones de funcion a proposito: sondas-deploy.ts las
+ * registra y este modulo importa sus utilidades (ciclo de modulos), y asi
+ * estan inicializadas sea cual sea el modulo que se cargue primero.
+ */
+import { readFileSync, statSync } from 'node:fs';
+import path from 'node:path';
+import type { Evidencia, ResultadoSonda } from '../core/doctor-deploy.js';
+import {
+  detectarAccionesSinSha,
+  detectarContrasenasCompose,
+  detectarDockerfile,
+  detectarFirebaseAbierto,
+  detectarPullRequestTarget,
+  detectarTablasSinRls,
+  detectarTokensGestor,
+  type Detector,
+  type FicheroLeido,
+} from '../core/doctor-deploy-reglas.js';
+import { buscarSilencio, decodificar, evidenciaSilenciada, type ContextoDeploy, type Sonda } from './sondas-deploy.js';
+
+const MAX_HALLAZGOS = 200;
+const MAX_RUTAS_ALCANCE = 10;
+
+export interface TextosSonda {
+  /** Que ficheros se buscan: «Dockerfile», «flujos de GitHub Actions (.github/workflows/*.yml)». */
+  queBusca: string;
+  /** El motivo de NO APLICA cuando no hay ninguno: «no hay ningun Dockerfile versionado». */
+  ninguno: string;
+  /** Que se comprobo en ellos (para la evidencia del alcance). */
+  comprobacion: string;
+  motivoFalla: (n: number) => string;
+  motivoOk: string;
+}
+
+const nombreBase = (ruta: string): string => ruta.slice(ruta.lastIndexOf('/') + 1);
+
+/**
+ * Construye una sonda: `filtro` elige los ficheros versionados que se miran, `detector`
+ * los analiza todos juntos y `textos` pone las frases del resultado.
+ */
+export function sondaPorFicheros(filtro: (ruta: string) => boolean, detector: Detector, textos: TextosSonda): Sonda {
+  return (ctx: ContextoDeploy): ResultadoSonda => {
+    const candidatos = ctx.versionados.filter(filtro);
+    if (candidatos.length === 0) {
+      return {
+        estado: 'no-aplica',
+        motivo: `${textos.ninguno}: no hay nada que revisar`,
+        evidencias: [{ descripcion: `git ls-files: ninguno de ${textos.queBusca} (sin contar node_modules, vendor, target, dist ni build)` }],
+      };
+    }
+    const max = ctx.opciones.maxBytesFichero;
+    const tope = max >= 1024 ? `${Math.round(max / 1024)} KiB` : `${max} bytes`;
+    const leidos: FicheroLeido[] = [];
+    const sinLeer: string[] = [];
+    for (const rel of candidatos) {
+      const abs = path.join(ctx.cwd, rel);
+      try {
+        const st = statSync(abs);
+        if (!st.isFile()) {
+          sinLeer.push(`${rel} (no es un fichero normal)`);
+          continue;
+        }
+        if (st.size > max) {
+          sinLeer.push(`${rel} (mayor de ${tope})`);
+          continue;
+        }
+        const contenido = decodificar(readFileSync(abs));
+        if (contenido === null) {
+          sinLeer.push(`${rel} (binario)`);
+          continue;
+        }
+        leidos.push({ ruta: rel, contenido });
+      } catch (e: unknown) {
+        sinLeer.push(`${rel} (no se pudo leer: ${(e as NodeJS.ErrnoException).code ?? 'error'})`);
+      }
+    }
+
+    const fallos: Evidencia[] = [];
+    const silenciadas: Evidencia[] = [];
+    const cubiertas: Evidencia[] = [];
+    let cortado = false;
+    for (const h of leidos.length > 0 ? detector(leidos) : []) {
+      const donde: Pick<Evidencia, 'fichero' | 'linea' | 'muestra'> = { fichero: h.fichero };
+      if (h.linea !== undefined) donde.linea = h.linea;
+      if (h.muestra !== undefined) donde.muestra = h.muestra;
+      if (h.cubiertoPor !== undefined) {
+        cubiertas.push({ descripcion: `${h.descripcion}: ya lo cuenta ${h.cubiertoPor}, no se repite aqui`, ...donde });
+        continue;
+      }
+      const s = buscarSilencio(ctx, h.patron, h.fichero, h.huella === null ? {} : { huella: h.huella });
+      if (s !== null) {
+        silenciadas.push(evidenciaSilenciada(s, h.patron, h.fichero, h.linea, undefined));
+      } else if (fallos.length < MAX_HALLAZGOS) {
+        fallos.push({ descripcion: `${h.descripcion} (patron ${h.patron}${h.huella === null ? '' : `, huella ${h.huella}`})`, ...donde });
+      } else {
+        cortado = true;
+      }
+    }
+
+    const listadas = leidos.slice(0, MAX_RUTAS_ALCANCE).map((f) => f.ruta);
+    const alcance: Evidencia = {
+      descripcion:
+        `${leidos.length} de ${candidatos.length} fichero(s) revisado(s) de ${textos.queBusca} (${listadas.join(', ')}` +
+        `${leidos.length > listadas.length ? `, y ${leidos.length - listadas.length} mas` : ''}): ` +
+        `${textos.comprobacion}; ${silenciadas.length} hallazgos silenciados`,
+    };
+    const textoSinLeer = `${sinLeer.length} fichero(s) sin leer (${sinLeer.join('; ')})`;
+
+    if (fallos.length > 0) {
+      return {
+        estado: 'falla',
+        motivo: `${textos.motivoFalla(fallos.length)}${cortado ? ' (y mas)' : ''}${sinLeer.length > 0 ? `; ademas ${textoSinLeer}` : ''}`,
+        evidencias: [...fallos, ...silenciadas, ...cubiertas, alcance],
+      };
+    }
+    if (sinLeer.length > 0) {
+      return {
+        estado: 'no-verificado',
+        motivo: `${textoSinLeer}: no se puede afirmar que esten bien. Revisalos a mano`,
+        evidencias: leidos.length > 0 ? [...silenciadas, ...cubiertas, alcance] : [...silenciadas, ...cubiertas],
+      };
+    }
+    return {
+      estado: 'ok',
+      motivo:
+        textos.motivoOk +
+        (cubiertas.length > 0 ? ` (${cubiertas.length} valor(es) que ya da como FALLA secretos-en-arbol no se cuentan dos veces)` : ''),
+      evidencias: [alcance, ...silenciadas, ...cubiertas],
+    };
+  };
+}
+
+// ---------------------------------------------------------------------
+// Filtros por nombre
+// ---------------------------------------------------------------------
+
+export const esReglaFirebase = (ruta: string): boolean => {
+  const b = nombreBase(ruta);
+  return /^(?:firestore|storage)(?:[.-][\w.-]+)?\.rules$/i.test(b) || /^database(?:[.-][\w.-]+)?\.rules\.json$/i.test(b);
+};
+
+export const esMigracionSupabase = (ruta: string): boolean => /(?:^|\/)supabase\/migrations\/.+\.sql$/i.test(ruta);
+
+export const esFicheroDeGestor = (ruta: string): boolean => ['.npmrc', '.pypirc', 'settings.xml'].includes(nombreBase(ruta));
+
+export const esCompose = (ruta: string): boolean => /^(?:docker-)?compose(?:[.-][\w.-]+)?\.ya?ml$/i.test(nombreBase(ruta));
+
+export const esFlujoGithub = (ruta: string): boolean => /^\.github\/workflows\/[^/]+\.ya?ml$/i.test(ruta);
+
+export const esFlujoOAccion = (ruta: string): boolean => esFlujoGithub(ruta) || /^action\.ya?ml$/i.test(nombreBase(ruta));
+
+export const esDockerfile = (ruta: string): boolean => {
+  const b = nombreBase(ruta);
+  if (/\.dockerignore$/i.test(b)) return false;
+  return /^(?:Dockerfile|Containerfile)(?:\.[\w.-]+)?$/i.test(b) || /\.(?:dockerfile|containerfile)$/i.test(b);
+};
+
+// ---------------------------------------------------------------------
+// Las siete sondas
+// ---------------------------------------------------------------------
+
+export function sondaReglasFirebase(ctx: ContextoDeploy): ResultadoSonda {
+  return sondaPorFicheros(esReglaFirebase, detectarFirebaseAbierto, {
+    queBusca: 'reglas de Firebase (firestore.rules, storage.rules, database.rules.json)',
+    ninguno: 'no hay ningun fichero de reglas de Firebase versionado',
+    comprobacion: 'ningun allow sin condicion, con if true o en modo de prueba por fecha, ni ".read"/".write": true',
+    motivoFalla: (n) => `${n} regla(s) de Firebase abierta(s) a cualquiera`,
+    motivoOk: 'ninguna regla de Firebase abierta a cualquiera',
+  })(ctx);
+}
+
+export function sondaMigracionesRls(ctx: ContextoDeploy): ResultadoSonda {
+  return sondaPorFicheros(esMigracionSupabase, detectarTablasSinRls, {
+    queBusca: 'migraciones SQL de Supabase (supabase/migrations/*.sql)',
+    ninguno: 'no hay ninguna migracion SQL de Supabase versionada',
+    comprobacion:
+      'cada create table tiene enable row level security en alguna migracion del conjunto (esquemas internos o privados aparte)',
+    motivoFalla: (n) => `${n} tabla(s) creada(s) en las migraciones sin activar RLS`,
+    motivoOk: 'todas las tablas creadas en las migraciones activan RLS',
+  })(ctx);
+}
+
+export function sondaTokensGestor(ctx: ContextoDeploy): ResultadoSonda {
+  return sondaPorFicheros(esFicheroDeGestor, detectarTokensGestor, {
+    queBusca: 'ficheros de gestores de paquetes (.npmrc, .pypirc, settings.xml)',
+    ninguno: 'no hay ningun .npmrc, .pypirc ni settings.xml versionado',
+    comprobacion: 'ningun _authToken, _auth, _password, password ni <password> literal (${VAR}, ${env.X} y {cifrada} no cuentan)',
+    motivoFalla: (n) => `${n} credencial(es) literal(es) en ficheros de gestores de paquetes`,
+    motivoOk: 'ninguna credencial literal en los ficheros de gestores de paquetes',
+  })(ctx);
+}
+
+export function sondaComposeContrasenas(ctx: ContextoDeploy): ResultadoSonda {
+  return sondaPorFicheros(esCompose, detectarContrasenasCompose, {
+    queBusca: 'docker-compose (docker-compose*.yml, compose*.yaml)',
+    ninguno: 'no hay ningun docker-compose versionado',
+    comprobacion: 'ninguna variable *PASSWORD, *SECRET, *TOKEN o *KEY con valor literal (${X}, $X y *_FILE no cuentan)',
+    motivoFalla: (n) => `${n} contrasena(s) o token(s) literal(es) en docker-compose`,
+    motivoOk: 'ninguna contrasena ni token literal en los docker-compose',
+  })(ctx);
+}
+
+export function sondaPullRequestTarget(ctx: ContextoDeploy): ResultadoSonda {
+  return sondaPorFicheros(esFlujoGithub, detectarPullRequestTarget, {
+    queBusca: 'flujos de GitHub Actions (.github/workflows/*.yml)',
+    ninguno: 'no hay ningun flujo de GitHub Actions versionado',
+    comprobacion: 'ningun flujo con pull_request_target trae el codigo del PR (ref: head.sha/head.ref/refs/pull, gh pr checkout)',
+    motivoFalla: (n) => `${n} paso(s) con pull_request_target que traen el codigo del PR`,
+    motivoOk: 'ningun flujo con pull_request_target trae el codigo del PR',
+  })(ctx);
+}
+
+export function sondaAccionesSinSha(ctx: ContextoDeploy): ResultadoSonda {
+  return sondaPorFicheros(esFlujoOAccion, detectarAccionesSinSha, {
+    queBusca: 'flujos y acciones de GitHub Actions (.github/workflows/*.yml, action.yml)',
+    ninguno: 'no hay ningun flujo ni accion de GitHub Actions versionado',
+    comprobacion: 'cada uses: de terceros fijado a un SHA de 40 caracteres (las de actions/ y github/, las locales ./ y docker:// no cuentan)',
+    motivoFalla: (n) => `${n} accion(es) de terceros sin fijar a un SHA`,
+    motivoOk: 'todas las acciones de terceros estan fijadas a un SHA',
+  })(ctx);
+}
+
+export function sondaDockerfileUser(ctx: ContextoDeploy): ResultadoSonda {
+  return sondaPorFicheros(esDockerfile, detectarDockerfile, {
+    queBusca: 'Dockerfile',
+    ninguno: 'no hay ningun Dockerfile versionado',
+    comprobacion: 'la etapa final declara un USER distinto de root (o hereda uno, o usa una imagen nonroot) y ningun ADD de URL sin --checksum',
+    motivoFalla: (n) => `${n} problema(s) en Dockerfile: etapa final como root o ADD de una URL`,
+    motivoOk: 'la etapa final de cada Dockerfile corre sin root y ningun ADD descarga URLs',
+  })(ctx);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
index 7ae1376..7833b96 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/sondas-deploy.ts
@@ -1,7 +1,9 @@
 /**
  * Las comprobaciones deterministas de `taskctl doctor-deploy` (TASK-066): las
- * unicas seis que existen. Todo punto del catalogo que no nombra una de estas
- * sondas es de juicio y sale NO VERIFICADO.
+ * seis de secretos, lockfile y dependencias estan aqui; las siete de
+ * configuracion (TASK-068, puntos 37 a 43) en sondas-deploy-config.ts. Todo
+ * punto del catalogo que no nombra una sonda registrada es de juicio y sale
+ * NO VERIFICADO.
  *
  * Reglas que valen para todas:
  * - Solo leen. Nada se escribe ni se cambia de rama.
@@ -16,7 +18,7 @@ import { closeSync, mkdtempSync, openSync, readFileSync, readSync, rmSync, statS
 import os from 'node:os';
 import path from 'node:path';
 import { buscarSecretos, IDS_PATRON } from '../core/secretos.js';
-import type { Silencio } from '../core/doctor-deploy-catalogo.js';
+import type { Silencio, SondaRegistrada } from '../core/doctor-deploy-catalogo.js';
 import type { Evidencia, ResultadoSonda, TipoDetectado } from '../core/doctor-deploy.js';
 import {
   interpretarCargoAudit,
@@ -28,6 +30,18 @@ import {
   type VeredictoAuditoria,
 } from '../core/doctor-deploy-auditoria.js';
 import { estaExcluido } from './deteccion-app.js';
+// Ciclo de modulos a proposito: sondas-deploy-config usa las utilidades de aqui y este
+// fichero registra sus sondas. Funciona en cualquier orden de carga porque esas sondas
+// son declaraciones de funcion (estan inicializadas antes de evaluar ningun modulo).
+import {
+  sondaAccionesSinSha,
+  sondaComposeContrasenas,
+  sondaDockerfileUser,
+  sondaMigracionesRls,
+  sondaPullRequestTarget,
+  sondaReglasFirebase,
+  sondaTokensGestor,
+} from './sondas-deploy-config.js';
 import { gitCrudo, gitTexto } from './git-crudo.js';
 import { ejecutarHerramienta, localizarHerramienta, versionDe } from './herramientas-deploy.js';
 
@@ -90,7 +104,7 @@ function esBinario(b: Buffer): boolean {
  * Texto del contenido, o null si es binario. Un UTF-16 con BOM (el `>` de
  * PowerShell 5.1 lo escribe asi) lleva NUL pero es texto: se decodifica.
  */
-function decodificar(b: Buffer): string | null {
+export function decodificar(b: Buffer): string | null {
   if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) return b.subarray(2).toString('utf16le');
   if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) {
     const par = b.subarray(2, 2 + ((b.length - 2) & ~1));
@@ -112,7 +126,7 @@ function cabeceraDe(abs: string): Buffer {
   }
 }
 
-interface ClaveHallazgo {
+export interface ClaveHallazgo {
   /** Hash del commit (historial). Ausente = hallazgo del arbol de trabajo. */
   commit?: string;
   /** Huella del valor, si se conoce. */
@@ -132,7 +146,7 @@ function claveDe(commit: string | undefined, huella: string | null): ClaveHallaz
  * (el parser lo obliga). Asi no se tapa una clave nueva del mismo patron en el
  * mismo fichero.
  */
-function buscarSilencio(ctx: ContextoDeploy, patron: string, fichero: string, clave: ClaveHallazgo): Silencio | null {
+export function buscarSilencio(ctx: ContextoDeploy, patron: string, fichero: string, clave: ClaveHallazgo): Silencio | null {
   for (const s of ctx.silencios) {
     if (s.patron !== patron || s.fichero !== fichero) continue;
     if (clave.commit !== undefined) {
@@ -147,7 +161,7 @@ function buscarSilencio(ctx: ContextoDeploy, patron: string, fichero: string, cl
   return null;
 }
 
-function evidenciaSilenciada(s: Silencio, patron: string, fichero: string, linea: number | undefined, commit: string | undefined): Evidencia {
+export function evidenciaSilenciada(s: Silencio, patron: string, fichero: string, linea: number | undefined, commit: string | undefined): Evidencia {
   const e: Evidencia = {
     descripcion: `SILENCIADO (silenciar_${s.numero}, patron ${patron}): ${s.motivo} - ${s.quien}, ${s.fecha}`,
     fichero,
@@ -1019,11 +1033,26 @@ export const sondaDependencias: Sonda = (ctx) => {
 // Registro
 // ---------------------------------------------------------------------
 
-export const SONDAS: Readonly<Record<string, Sonda>> = {
+/**
+ * Una entrada por cada nombre de `SONDAS_REGISTRADAS` (TASK-068): el tipo obliga a que
+ * las dos listas coincidan, asi que registrar una sonda sin implementarla (o al reves)
+ * no compila. Hacia fuera se ve como un registro indexable por texto (el catalogo
+ * guarda la sonda como `string`).
+ */
+const REGISTRO: Readonly<Record<SondaRegistrada, Sonda>> = {
   'secretos-arbol': sondaSecretosArbol,
   'secretos-historial': sondaSecretosHistorial,
   'ficheros-secretos': sondaFicherosSecretos,
   'gitignore-env': sondaGitignoreEnv,
   lockfile: sondaLockfile,
   dependencias: sondaDependencias,
+  'reglas-firebase': sondaReglasFirebase,
+  'migraciones-rls': sondaMigracionesRls,
+  'tokens-gestor': sondaTokensGestor,
+  'compose-contrasenas': sondaComposeContrasenas,
+  'ci-pull-request-target': sondaPullRequestTarget,
+  'acciones-sin-sha': sondaAccionesSinSha,
+  'dockerfile-user': sondaDockerfileUser,
 };
+
+export const SONDAS: Readonly<Record<string, Sonda>> = REGISTRO;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-aplicaciones.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-aplicaciones.test.ts
new file mode 100644
index 0000000..74934d4
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-aplicaciones.test.ts
@@ -0,0 +1,379 @@
+/**
+ * TASK-068: deteccion del tipo de aplicacion (web, api, Android, iOS, Flutter,
+ * React Native, CLI, libreria) y su efecto en los puntos, con
+ * `taskctl doctor-deploy --json` sobre repos Git temporales reales con la
+ * estructura de carpetas de cada tipo (nunca aplanada).
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile } from 'node:fs/promises';
+import { motivoNoAplicaPorAplicacion } from '../../src/commands/doctor-deploy.js';
+import type { PuntoCatalogo } from '../../src/core/doctor-deploy-catalogo.js';
+import type { AplicacionDetectada, InformeDeploy } from '../../src/core/doctor-deploy.js';
+import { analisis, commit, conRepo, ejecutar, escribir, NODE, punto } from '../helpers/deploy-fixtures.js';
+
+/** Los puntos que nombra el criterio 2. */
+const SEIS = ['https-obligatorio', 'cookies-seguras', 'security-headers', 'rate-limits', 'backups-y-migraciones', 'health-check'];
+
+const GITIGNORE = { '.gitignore': 'node_modules/\n.env\n' };
+
+const WEB: Record<string, string> = {
+  ...GITIGNORE,
+  'package.json': '{"name":"web","private":true,"scripts":{"dev":"vite"},"devDependencies":{"vite":"^5.0.0"}}\n',
+  'package-lock.json': '{"name":"web","lockfileVersion":3}\n',
+  'vite.config.ts': 'import { defineConfig } from "vite";\nexport default defineConfig({});\n',
+  'index.html': '<!doctype html><div id="app"></div>\n',
+  'src/main.ts': 'document.querySelector("#app")!.textContent = "hola";\n',
+};
+
+const API: Record<string, string> = {
+  ...GITIGNORE,
+  'package.json': '{"name":"api","version":"1.0.0","main":"src/server.js","dependencies":{"express":"^4.19.0"}}\n',
+  'package-lock.json': '{"name":"api","lockfileVersion":3}\n',
+  'src/server.js': 'const express = require("express");\nexpress().listen(3000);\n',
+};
+
+const ANDROID: Record<string, string> = {
+  '.gitignore': '.gradle/\nbuild/\nlocal.properties\n',
+  'settings.gradle': 'rootProject.name = "MiApp"\ninclude ":app"\n',
+  'build.gradle': 'plugins {\n  id "com.android.application" version "8.5.0" apply false\n}\n',
+  'app/build.gradle': 'plugins {\n  id "com.android.application"\n}\nandroid { namespace "com.ejemplo.miapp" }\n',
+  'app/src/main/AndroidManifest.xml': '<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n  <application android:label="MiApp" />\n</manifest>\n',
+  'app/src/main/java/com/ejemplo/miapp/MainActivity.kt': 'package com.ejemplo.miapp\nclass MainActivity\n',
+};
+
+const IOS: Record<string, string> = {
+  '.gitignore': 'xcuserdata/\nPods/\n',
+  'MiApp.xcodeproj/project.pbxproj': '// !$*UTF8*$!\n{\n  buildSettings = {\n    SDKROOT = iphoneos;\n    TARGETED_DEVICE_FAMILY = "1,2";\n  };\n}\n',
+  'MiApp/AppDelegate.swift': 'import UIKit\n@main class AppDelegate: UIResponder, UIApplicationDelegate {}\n',
+  'MiApp/Info.plist': '<?xml version="1.0"?><plist version="1.0"><dict/></plist>\n',
+};
+
+const FLUTTER: Record<string, string> = {
+  '.gitignore': '.dart_tool/\nbuild/\n',
+  'pubspec.yaml': 'name: mi_app\nenvironment:\n  sdk: ">=3.0.0 <4.0.0"\ndependencies:\n  flutter:\n    sdk: flutter\n',
+  'pubspec.lock': 'packages: {}\n',
+  'lib/main.dart': 'import "package:flutter/material.dart";\nvoid main() => runApp(const SizedBox());\n',
+  'android/app/build.gradle': 'plugins {\n  id "com.android.application"\n  id "dev.flutter.flutter-gradle-plugin"\n}\n',
+  'android/app/src/main/AndroidManifest.xml': '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application/></manifest>\n',
+  'ios/Runner.xcodeproj/project.pbxproj': '{\n  buildSettings = { SDKROOT = iphoneos; };\n}\n',
+  'ios/Runner/AppDelegate.swift': 'import Flutter\n',
+};
+
+const REACT_NATIVE: Record<string, string> = {
+  ...GITIGNORE,
+  'package.json': '{"name":"MiApp","version":"0.0.1","private":true,"dependencies":{"react":"18.3.1","react-native":"0.75.0"}}\n',
+  'package-lock.json': '{"name":"MiApp","lockfileVersion":3}\n',
+  'index.js': 'import { AppRegistry } from "react-native";\n',
+  'metro.config.js': 'const { getDefaultConfig } = require("@react-native/metro-config");\nmodule.exports = getDefaultConfig(__dirname);\n',
+  'android/app/build.gradle': 'apply plugin: "com.android.application"\napply plugin: "com.facebook.react"\n',
+  'android/app/src/main/AndroidManifest.xml': '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application/></manifest>\n',
+  'ios/MiApp.xcodeproj/project.pbxproj': '{\n  buildSettings = { SDKROOT = iphoneos; };\n}\n',
+};
+
+const CLI: Record<string, string> = {
+  ...GITIGNORE,
+  'package.json': '{"name":"mi-cli","version":"1.0.0","bin":{"mi-cli":"bin/cli.js"},"dependencies":{}}\n',
+  'package-lock.json': '{"name":"mi-cli","lockfileVersion":3}\n',
+  'bin/cli.js': '#!/usr/bin/env node\nconsole.log("hola");\n',
+};
+
+const LIBRERIA: Record<string, string> = {
+  ...GITIGNORE,
+  'package.json': '{"name":"mi-lib","version":"1.0.0","exports":{".":"./src/index.js"},"peerDependencies":{}}\n',
+  'package-lock.json': '{"name":"mi-lib","lockfileVersion":3}\n',
+  'src/index.js': 'export const suma = (a, b) => a + b;\n',
+};
+
+function ids(informe: InformeDeploy): string[] {
+  return informe.aplicaciones.map((a) => a.id).sort();
+}
+
+function marcadorDe(informe: InformeDeploy, id: string): string[] {
+  return (informe.aplicaciones.find((a) => a.id === id)?.marcadores ?? []).map((m) => m.fichero);
+}
+
+// ---------------------------------------------------------------------
+// Deteccion, una fixture por tipo
+// ---------------------------------------------------------------------
+
+test('web: vite.config.ts lo decide; sin cli, api ni libreria', async () => {
+  await conRepo(WEB, async (raiz, op) => {
+    const j = analisis(raiz, op);
+    assert.deepEqual(ids(j), ['web']);
+    assert.deepEqual(marcadorDe(j, 'web'), ['vite.config.ts']);
+    assert.equal(j.version, 3);
+  });
+});
+
+test('api: package.json con express', async () => {
+  await conRepo(API, async (raiz, op) => {
+    const j = analisis(raiz, op);
+    assert.deepEqual(ids(j), ['api']);
+    assert.deepEqual(j.aplicaciones[0]?.marcadores, [{ fichero: 'package.json', contiene: '"express"' }]);
+  });
+});
+
+test('android nativo: app/build.gradle con com.android.application y el manifiesto a 3 carpetas', async () => {
+  await conRepo(ANDROID, async (raiz, op) => {
+    const j = analisis(raiz, op);
+    assert.deepEqual(ids(j), ['android']);
+    const m = marcadorDe(j, 'android');
+    assert.ok(m.includes('app/build.gradle'), m.join(', '));
+    assert.ok(m.includes('app/src/main/AndroidManifest.xml'), m.join(', '));
+  });
+});
+
+test('ios: project.pbxproj con SDKROOT = iphoneos', async () => {
+  await conRepo(IOS, async (raiz, op) => {
+    const j = analisis(raiz, op);
+    assert.deepEqual(ids(j), ['ios']);
+    assert.deepEqual(j.aplicaciones[0]?.marcadores, [{ fichero: 'MiApp.xcodeproj/project.pbxproj', contiene: 'iphoneos' }]);
+  });
+});
+
+test('flutter: pubspec.yaml con sdk: flutter (y sus carpetas android e ios)', async () => {
+  await conRepo(FLUTTER, async (raiz, op) => {
+    const j = analisis(raiz, op);
+    assert.deepEqual(ids(j), ['android', 'flutter', 'ios']);
+    assert.deepEqual(marcadorDe(j, 'flutter'), ['pubspec.yaml']);
+    // El manifiesto de android/app/src/main/ esta a 4 carpetas: no es lo que detecta Android.
+    assert.deepEqual(marcadorDe(j, 'android'), ['android/app/build.gradle']);
+  });
+});
+
+test('react native: package.json con react-native, con la estructura real (manifiesto a 4 carpetas)', async () => {
+  await conRepo(REACT_NATIVE, async (raiz, op) => {
+    const j = analisis(raiz, op);
+    assert.deepEqual(ids(j), ['android', 'ios', 'react-native']);
+    assert.deepEqual(marcadorDe(j, 'react-native'), ['metro.config.js', 'package.json']);
+    assert.ok(!marcadorDe(j, 'android').includes('android/app/src/main/AndroidManifest.xml'));
+  });
+});
+
+test('react native sin carpeta android ni ios: se detecta igual por su manifiesto de raiz', async () => {
+  const soloRaiz = Object.fromEntries(Object.entries(REACT_NATIVE).filter(([k]) => !k.startsWith('android/') && !k.startsWith('ios/')));
+  await conRepo(soloRaiz, async (raiz, op) => {
+    assert.deepEqual(ids(analisis(raiz, op)), ['react-native']);
+  });
+});
+
+test('cli: package.json con "bin"; no sale libreria, api ni react-native', async () => {
+  await conRepo(CLI, async (raiz, op) => {
+    const j = analisis(raiz, op);
+    assert.deepEqual(ids(j), ['cli']);
+    assert.deepEqual(j.aplicaciones[0]?.marcadores, [{ fichero: 'package.json', contiene: '"bin"' }]);
+  });
+});
+
+test('libreria: package.json con "exports"', async () => {
+  await conRepo(LIBRERIA, async (raiz, op) => {
+    const j = analisis(raiz, op);
+    assert.deepEqual(ids(j), ['libreria']);
+    assert.deepEqual(marcadorDe(j, 'libreria'), ['package.json']);
+  });
+});
+
+// ---------------------------------------------------------------------
+// Negativos
+// ---------------------------------------------------------------------
+
+test('negativo: un package.json sin bin ni react-native no sale cli ni react-native (ni ningun tipo)', async () => {
+  await conRepo(NODE, async (raiz, op) => {
+    const j = analisis(raiz, op);
+    assert.deepEqual(ids(j), []);
+    assert.deepEqual(j.tipos.map((t) => t.id).sort(), ['node', 'npm']);
+  });
+});
+
+test('negativo: pubspec.yaml de un paquete Dart sin flutter, y build.gradle de Java sin Android', async () => {
+  await conRepo(
+    {
+      'pubspec.yaml': 'name: utilidades\nenvironment:\n  sdk: ">=3.0.0 <4.0.0"\ndependencies:\n  path: ^1.9.0\n',
+      'build.gradle': 'plugins {\n  id "java-library"\n}\n',
+      'lib/utilidades.dart': 'int suma(int a, int b) => a + b;\n',
+    },
+    async (raiz, op) => {
+      assert.deepEqual(ids(analisis(raiz, op)), []);
+    }
+  );
+});
+
+test('negativo: la palabra en otro fichero que no es marcador no cuenta (README con "bin" y react-native)', async () => {
+  await conRepo({ ...NODE, 'README.md': 'Instala con "bin" y usa "react-native" o "express".\n' }, async (raiz, op) => {
+    assert.deepEqual(ids(analisis(raiz, op)), []);
+  });
+});
+
+test('negativo: un marcador mas hondo que 3 carpetas no cuenta', async () => {
+  await conRepo({ ...NODE, 'a/b/c/d/package.json': '{"bin":{"x":"x.js"}}\n' }, async (raiz, op) => {
+    assert.deepEqual(ids(analisis(raiz, op)), []);
+  });
+});
+
+// ---------------------------------------------------------------------
+// Criterio 2: NO APLICA por tipo de aplicacion
+// ---------------------------------------------------------------------
+
+for (const [nombre, fixture, tipo] of [
+  ['libreria', LIBRERIA, 'libreria'],
+  ['CLI', CLI, 'cli'],
+] as const) {
+  test(`criterio 2: en una ${nombre}, los seis puntos salen no-aplica con un motivo que nombra el tipo`, async () => {
+    await conRepo(fixture, async (raiz, op) => {
+      const j = analisis(raiz, op);
+      for (const id of SEIS) {
+        const p = punto(j, id);
+        assert.equal(p.estado, 'no-aplica', `${id}: ${p.estado} (${p.motivo})`);
+        assert.match(p.motivo, new RegExp(`aplicacion detectada: ${tipo} \\(por package\\.json contiene "`), `${id}: ${p.motivo}`);
+      }
+      // Un punto que no depende del tipo de aplicacion sigue aplicando.
+      assert.notEqual(punto(j, 'auth-en-servidor').estado, 'no-aplica');
+      assert.notEqual(punto(j, 'secretos-en-arbol').estado, 'no-aplica');
+    });
+  });
+}
+
+for (const [nombre, fixture] of [
+  ['web', WEB],
+  ['sin tipo de aplicacion detectado', NODE],
+] as const) {
+  test(`criterio 2: en una fixture ${nombre}, ninguno de los seis sale no-aplica`, async () => {
+    await conRepo(fixture, async (raiz, op) => {
+      const j = analisis(raiz, op);
+      for (const id of SEIS) {
+        const p = punto(j, id);
+        assert.notEqual(p.estado, 'no-aplica', `${id}: ${p.motivo}`);
+      }
+    });
+  });
+}
+
+test('un tipo movil no apaga los puntos de servicio (solo cli o libreria lo hacen)', async () => {
+  await conRepo(REACT_NATIVE, async (raiz, op) => {
+    const j = analisis(raiz, op);
+    for (const id of SEIS) assert.notEqual(punto(j, id).estado, 'no-aplica', id);
+  });
+});
+
+test('dentro del eje basta con uno: un repo con marcadores de cli y de web aplica', async () => {
+  await conRepo({ ...CLI, 'vite.config.ts': 'export default {};\n' }, async (raiz, op) => {
+    const j = analisis(raiz, op);
+    assert.deepEqual(ids(j), ['cli', 'web']);
+    for (const id of SEIS) assert.notEqual(punto(j, id).estado, 'no-aplica', id);
+  });
+});
+
+test('cli y api a la vez (un servidor express con bin) aplica', async () => {
+  await conRepo(
+    { ...API, 'package.json': '{"name":"srv","bin":{"srv":"src/server.js"},"dependencies":{"express":"^4.19.0"}}\n' },
+    async (raiz, op) => {
+      const j = analisis(raiz, op);
+      assert.deepEqual(ids(j), ['api', 'cli']);
+      for (const id of SEIS) assert.notEqual(punto(j, id).estado, 'no-aplica', id);
+    }
+  );
+});
+
+// ---------------------------------------------------------------------
+// Interseccion de los dos ejes
+// ---------------------------------------------------------------------
+
+const CAPA_INTERSECCION =
+  'punto_1_id: solo-rust-cli\npunto_1_severidad: baja\npunto_1_tipos: [rust]\npunto_1_aplicaciones: [cli]\n' +
+  'punto_1_metodo: juicio\npunto_1_arreglo: Arreglo largo\npunto_1_descripcion: Descripcion larga\n' +
+  'punto_2_id: node-cli\npunto_2_severidad: baja\npunto_2_tipos: [node]\npunto_2_aplicaciones: [cli]\n' +
+  'punto_2_metodo: juicio\npunto_2_arreglo: Arreglo largo\npunto_2_descripcion: Descripcion larga\n' +
+  'punto_3_id: node-sin-eje-app\npunto_3_severidad: baja\npunto_3_tipos: [node]\n' +
+  'punto_3_metodo: juicio\npunto_3_arreglo: Arreglo largo\npunto_3_descripcion: Descripcion larga\n';
+
+test('interseccion: los ejes se combinan con Y (lenguaje Y aplicacion)', async () => {
+  await conRepo({ ...CLI, '.taskcode/doctor-deploy.yml': CAPA_INTERSECCION }, async (raiz, op) => {
+    const j = analisis(raiz, op);
+    // Aplicacion si (cli), lenguaje no (no hay rust): NO APLICA por el lenguaje.
+    const rustCli = punto(j, 'solo-rust-cli');
+    assert.equal(rustCli.estado, 'no-aplica');
+    assert.match(rustCli.motivo, /solo aplica a rust/);
+    // Los dos ejes casan: aplica (de juicio, sale NO VERIFICADO).
+    assert.equal(punto(j, 'node-cli').estado, 'no-verificado');
+    assert.equal(punto(j, 'node-sin-eje-app').estado, 'no-verificado');
+  });
+  await conRepo({ ...LIBRERIA, '.taskcode/doctor-deploy.yml': CAPA_INTERSECCION }, async (raiz, op) => {
+    const j = analisis(raiz, op);
+    // Lenguaje si (node), aplicacion no (libreria): NO APLICA por la aplicacion.
+    const nodeCli = punto(j, 'node-cli');
+    assert.equal(nodeCli.estado, 'no-aplica');
+    assert.match(nodeCli.motivo, /solo aplica a aplicaciones de tipo cli; aplicacion detectada: libreria/);
+    // Sin campo aplicaciones, el eje no lo toca.
+    assert.equal(punto(j, 'node-sin-eje-app').estado, 'no-verificado');
+  });
+  await conRepo({ ...NODE, '.taskcode/doctor-deploy.yml': CAPA_INTERSECCION }, async (raiz, op) => {
+    // Sin tipo de aplicacion detectado, el eje de aplicacion no apaga nada.
+    assert.equal(punto(analisis(raiz, op), 'node-cli').estado, 'no-verificado');
+  });
+});
+
+const PUNTO_BASE: PuntoCatalogo = {
+  id: 'p',
+  severidad: 'media',
+  tipos: ['todos'],
+  aplicaciones: ['web', 'api'],
+  metodo: 'juicio',
+  sonda: null,
+  arreglo: 'a',
+  descripcion: 'd',
+  referencia: null,
+  origen: 'plugin',
+};
+
+const app = (id: string, fichero = 'package.json', contiene: string | null = null): AplicacionDetectada => ({
+  id,
+  nombre: id,
+  rutas: ['.'],
+  marcadores: [{ fichero, contiene }],
+});
+
+test('motivoNoAplicaPorAplicacion: tabla de la regla', () => {
+  // Sin deteccion: aplica.
+  assert.equal(motivoNoAplicaPorAplicacion(PUNTO_BASE, []), null);
+  // Punto sin campo: aplica a todo.
+  assert.equal(motivoNoAplicaPorAplicacion({ ...PUNTO_BASE, aplicaciones: null }, [app('cli')]), null);
+  // Alguno de los detectados esta en la lista: aplica.
+  assert.equal(motivoNoAplicaPorAplicacion(PUNTO_BASE, [app('cli'), app('api')]), null);
+  // Ninguno esta: NO APLICA, con cada tipo y su marcador.
+  const m = motivoNoAplicaPorAplicacion(PUNTO_BASE, [app('cli', 'package.json', '"bin"'), app('libreria', 'Cargo.toml', '[lib]')]);
+  assert.equal(m, 'solo aplica a aplicaciones de tipo web o api; aplicacion detectada: cli (por package.json contiene "bin"), libreria (por Cargo.toml contiene "[lib]")');
+});
+
+// ---------------------------------------------------------------------
+// Salidas: texto, informe en Markdown y JSON
+// ---------------------------------------------------------------------
+
+test('la salida de texto y el informe dicen la aplicacion detectada y su marcador', async () => {
+  await conRepo(CLI, async (raiz, op) => {
+    const texto = ejecutar(raiz, op, []).salida;
+    assert.match(texto, /^Aplicacion detectada: Herramienta de linea de comandos \[cli\] \(package\.json contiene "bin"\)$/m);
+    const r = ejecutar(raiz, op, ['--escribir']);
+    const md = await readFile(r.rutaInforme as string, 'utf8');
+    assert.match(md, /^- Aplicacion detectada: Herramienta de linea de comandos \[cli\] \(package\.json contiene "bin"\)$/m);
+    const j = JSON.parse(await readFile(r.rutaJson as string, 'utf8')) as InformeDeploy;
+    assert.equal(j.version, 3);
+    assert.deepEqual(j.aplicaciones.map((a) => a.id), ['cli']);
+  });
+});
+
+test('sin tipo de aplicacion, el texto lo dice y que los puntos aplican', async () => {
+  await conRepo(NODE, async (raiz, op) => {
+    assert.match(ejecutar(raiz, op, []).salida, /^Aplicacion detectada: ninguna \(.*aplican\)$/m);
+  });
+});
+
+test('un fichero marcador sin versionar (no ignorado) tambien cuenta, como en los tipos', async () => {
+  await conRepo(NODE, async (raiz, op) => {
+    await escribir(raiz, { 'herramienta/package.json': '{"bin":"cli.js"}\n' });
+    const j = analisis(raiz, op);
+    assert.deepEqual(ids(j), ['cli']);
+    assert.deepEqual(j.aplicaciones[0]?.rutas, ['herramienta']);
+    await commit(raiz, 'herramienta');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-config.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-config.test.ts
new file mode 100644
index 0000000..8ff953c
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-config.test.ts
@@ -0,0 +1,314 @@
+/**
+ * TASK-068: las siete sondas de configuracion de `taskctl doctor-deploy`
+ * (puntos 37 a 43) contra repos Git temporales REALES. Por sonda, un par
+ * «FALLA» / «OK» nombrando el id del punto; ademas NO APLICA sin ficheros, NO
+ * VERIFICADO con un fichero que no se pudo leer, enmascarado en todos los
+ * canales, silencios y el rechazo de un veredicto del agente para un punto que
+ * ahora es determinista. Las variantes finas estan en
+ * test/core/doctor-deploy-reglas.test.ts.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, readdir, readFile, rm, unlink, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import type { InformeDeploy, ResultadoPunto } from '../../src/core/doctor-deploy.js';
+import {
+  NODE,
+  commit,
+  conRepo,
+  conRepoDevelop,
+  ejecutar,
+  ejecutarCompleto,
+  escribir,
+  git,
+  punto,
+  type OpcionesTest,
+} from '../helpers/deploy-fixtures.js';
+
+const informe = (raiz: string, opciones: OpcionesTest): InformeDeploy => JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
+
+/** Ninguna subcadena de 8 o mas caracteres del valor en el texto. */
+function assertSinValor(texto: string, valor: string, canal: string): void {
+  for (let i = 0; i + 8 <= valor.length; i++) {
+    const v = valor.slice(i, i + 8);
+    assert.ok(!texto.includes(v), `el canal "${canal}" contiene la subcadena "${v}" del secreto`);
+  }
+}
+
+function assertFalla(p: ResultadoPunto, fichero: string, descripcion: RegExp): void {
+  assert.equal(p.estado, 'falla', `${p.id}: ${p.motivo}`);
+  assert.equal(p.metodo, 'determinista');
+  assert.equal(p.origen, 'sonda');
+  assert.ok(
+    p.evidencias.some((e) => e.fichero === fichero && descripcion.test(e.descripcion)),
+    `${p.id}: ninguna evidencia en ${fichero} con ${String(descripcion)}: ${JSON.stringify(p.evidencias)}`
+  );
+}
+
+function assertOk(p: ResultadoPunto): void {
+  assert.equal(p.estado, 'ok', `${p.id}: ${p.motivo} ${JSON.stringify(p.evidencias)}`);
+  assert.ok(p.evidencias.length > 0, `${p.id}: OK sin evidencia`);
+  assert.match(p.evidencias.map((e) => e.descripcion).join(' '), /revisado/);
+}
+
+const DOCKER: Record<string, string> = { ...NODE, Dockerfile: 'FROM node:22\nUSER node\nCMD ["node", "index.js"]\n' };
+const TOKEN = 'Hk3Ns8Qw2Lp5Vx9Rt4Yz7BmQ1';
+const PASS = 'Pg7xQ2mLw9Zr4Tv8';
+const SHA = '0123456789abcdef0123456789abcdef01234567';
+
+// ---------------------------------------------------------------------
+// Un par FALLA / OK por sonda
+// ---------------------------------------------------------------------
+
+const firestore = (regla: string): string =>
+  `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      ${regla}\n    }\n  }\n}\n`;
+
+test('reglas-firebase-abiertas: FALLA con allow read, write: if true; OK con una regla que exige sesion', async () => {
+  await conRepo({ ...NODE, 'firestore.rules': firestore('allow read, write: if true;') }, async (raiz, opciones) => {
+    assertFalla(punto(informe(raiz, opciones), 'reglas-firebase-abiertas'), 'firestore.rules', /regla abierta a cualquiera \(if true\)/);
+  });
+  await conRepo({ ...NODE, 'firestore.rules': firestore('allow read, write: if request.auth != null;') }, async (raiz, opciones) => {
+    assertOk(punto(informe(raiz, opciones), 'reglas-firebase-abiertas'));
+  });
+});
+
+test('migraciones-sin-rls: FALLA sin RLS; OK con el RLS activado en una migracion POSTERIOR', async () => {
+  const crear = { 'supabase/migrations/20240101000000_init.sql': 'create table public.notas (id bigint primary key);\n' };
+  await conRepo({ ...NODE, ...crear }, async (raiz, opciones) => {
+    assertFalla(punto(informe(raiz, opciones), 'migraciones-sin-rls'), 'supabase/migrations/20240101000000_init.sql', /public\.notas/);
+  });
+  const activar = { 'supabase/migrations/20240201000000_rls.sql': 'alter table notas enable row level security;\n' };
+  await conRepo({ ...NODE, ...crear, ...activar }, async (raiz, opciones) => {
+    assertOk(punto(informe(raiz, opciones), 'migraciones-sin-rls'));
+  });
+});
+
+test('tokens-en-ficheros-de-gestor: un _authToken que los patrones genericos NO cazan da FALLA aqui (y secretos-en-arbol sigue OK)', async () => {
+  await conRepo({ ...NODE, '.npmrc': `//registry.npmjs.org/:_authToken=${TOKEN}\n` }, async (raiz, opciones) => {
+    const i = informe(raiz, opciones);
+    assertFalla(punto(i, 'tokens-en-ficheros-de-gestor'), '.npmrc', /credencial literal en \.npmrc/);
+    assert.equal(punto(i, 'secretos-en-arbol').estado, 'ok', 'el token es generico: ninguna sonda lo contaria sin el punto 39');
+  });
+  await conRepo({ ...NODE, '.npmrc': '//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n' }, async (raiz, opciones) => {
+    assertOk(punto(informe(raiz, opciones), 'tokens-en-ficheros-de-gestor'));
+  });
+});
+
+test('compose-con-contrasenas: FALLA con una contrasena literal; OK con ${VAR} y *_FILE', async () => {
+  const compose = (env: string): string => `services:\n  db:\n    image: postgres:16\n    environment:\n${env}`;
+  await conRepo({ ...DOCKER, 'docker-compose.yml': compose(`      POSTGRES_PASSWORD: ${PASS}\n`) }, async (raiz, opciones) => {
+    assertFalla(punto(informe(raiz, opciones), 'compose-con-contrasenas'), 'docker-compose.yml', /variable POSTGRES_PASSWORD/);
+  });
+  await conRepo(
+    { ...DOCKER, 'docker-compose.yml': compose('      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}\n      POSTGRES_PASSWORD_FILE: /run/secrets/db\n') },
+    async (raiz, opciones) => {
+      assertOk(punto(informe(raiz, opciones), 'compose-con-contrasenas'));
+    }
+  );
+});
+
+test('ci-pull-request-target: FALLA con checkout del head del PR; OK con el mismo evento sin traer su codigo', async () => {
+  const flujo = (paso: string): string => `on: [pull_request_target]\njobs:\n  t:\n    runs-on: ubuntu-latest\n    steps:\n${paso}`;
+  const conRef = '      - uses: actions/checkout@v4\n        with:\n          ref: ${{ github.event.pull_request.head.sha }}\n';
+  await conRepo({ ...NODE, '.github/workflows/pr.yml': flujo(conRef) }, async (raiz, opciones) => {
+    assertFalla(punto(informe(raiz, opciones), 'ci-pull-request-target'), '.github/workflows/pr.yml', /pull_request_target y trae el codigo del PR/);
+  });
+  await conRepo({ ...NODE, '.github/workflows/pr.yml': flujo('      - run: echo "etiquetar"\n') }, async (raiz, opciones) => {
+    assertOk(punto(informe(raiz, opciones), 'ci-pull-request-target'));
+  });
+});
+
+test('acciones-ci-sin-sha: FALLA con @v5 de terceros; OK con SHA, ./local y actions/checkout@v4', async () => {
+  const flujo = (uses: string[]): string => `on: push\njobs:\n  b:\n    runs-on: ubuntu-latest\n    steps:\n${uses.map((u) => `      - uses: ${u}\n`).join('')}`;
+  await conRepo({ ...NODE, '.github/workflows/b.yml': flujo(['docker/build-push-action@v5']) }, async (raiz, opciones) => {
+    assertFalla(punto(informe(raiz, opciones), 'acciones-ci-sin-sha'), '.github/workflows/b.yml', /docker\/build-push-action@v5/);
+  });
+  await conRepo(
+    { ...NODE, '.github/workflows/b.yml': flujo([`docker/build-push-action@${SHA}`, './.github/actions/local', 'actions/checkout@v4']) },
+    async (raiz, opciones) => {
+      assertOk(punto(informe(raiz, opciones), 'acciones-ci-sin-sha'));
+    }
+  );
+});
+
+test('dockerfile-sin-user: FALLA en un multietapa con USER solo en el builder; OK con USER en la etapa final', async () => {
+  const builder = 'FROM node:22 AS build\nUSER node\nRUN echo construir\n';
+  await conRepo({ ...NODE, Dockerfile: `${builder}FROM nginx:1.27\nCOPY --from=build /app /srv\n` }, async (raiz, opciones) => {
+    assertFalla(punto(informe(raiz, opciones), 'dockerfile-sin-user'), 'Dockerfile', /etapa final \(FROM nginx:1\.27\) no declara USER/);
+  });
+  await conRepo({ ...NODE, Dockerfile: `${builder}FROM nginx:1.27\nUSER nginx\n` }, async (raiz, opciones) => {
+    assertOk(punto(informe(raiz, opciones), 'dockerfile-sin-user'));
+  });
+});
+
+// ---------------------------------------------------------------------
+// NO APLICA, NO VERIFICADO
+// ---------------------------------------------------------------------
+
+test('sin ficheros que revisar: las siete salen NO APLICA con motivo, nunca OK', async () => {
+  // Con compose (tipo docker detectado) pero sin Dockerfile, sin reglas, sin migraciones, sin flujos.
+  await conRepo({ ...NODE, 'compose.yaml': 'services:\n  app:\n    image: app\n' }, async (raiz, opciones) => {
+    const i = informe(raiz, opciones);
+    const esperados: Record<string, RegExp> = {
+      'reglas-firebase-abiertas': /no hay ningun fichero de reglas de Firebase versionado/,
+      'migraciones-sin-rls': /no hay ninguna migracion SQL de Supabase versionada/,
+      'tokens-en-ficheros-de-gestor': /no hay ningun \.npmrc, \.pypirc ni settings\.xml versionado/,
+      'ci-pull-request-target': /no hay ningun flujo de GitHub Actions versionado/,
+      'acciones-ci-sin-sha': /no hay ningun flujo ni accion de GitHub Actions versionado/,
+      'dockerfile-sin-user': /no hay ningun Dockerfile versionado/,
+    };
+    for (const [id, motivo] of Object.entries(esperados)) {
+      const p = punto(i, id);
+      assert.equal(p.estado, 'no-aplica', `${id}: ${p.estado} ${p.motivo}`);
+      assert.match(p.motivo, motivo, id);
+    }
+    // compose-con-contrasenas si tiene fichero: sale OK con evidencia.
+    assertOk(punto(i, 'compose-con-contrasenas'));
+  });
+});
+
+test('un fichero mayor que maxBytesFichero, o versionado pero ilegible, da NO VERIFICADO (nunca OK)', async () => {
+  await conRepo(DOCKER, async (raiz, opciones) => {
+    const grande = punto(informe(raiz, { ...opciones, maxBytesFichero: 16 }), 'dockerfile-sin-user');
+    assert.equal(grande.estado, 'no-verificado', grande.motivo);
+    assert.match(grande.motivo, /Dockerfile \(mayor de 16 bytes\)/);
+    // Versionado pero borrado del arbol de trabajo: no se puede leer.
+    await unlink(path.join(raiz, 'Dockerfile'));
+    const borrado = punto(informe(raiz, opciones), 'dockerfile-sin-user');
+    assert.equal(borrado.estado, 'no-verificado', borrado.motivo);
+    assert.match(borrado.motivo, /no se pudo leer/);
+  });
+});
+
+test('un fichero que no se pudo leer no tapa la FALLA de otro, y el motivo lo dice', async () => {
+  const grande = `FROM node:22\nUSER node\nRUN echo ${'x'.repeat(80)}\n`;
+  await conRepo({ ...NODE, Dockerfile: 'FROM node:22\n', 'api/Dockerfile': grande }, async (raiz, opciones) => {
+    const p = punto(informe(raiz, { ...opciones, maxBytesFichero: 60 }), 'dockerfile-sin-user');
+    assertFalla(p, 'Dockerfile', /no declara USER/);
+    assert.match(p.motivo, /ademas 1 fichero\(s\) sin leer \(api\/Dockerfile \(mayor de 60 bytes\)\)/);
+  });
+});
+
+// ---------------------------------------------------------------------
+// Doble FALLA con secretos-en-arbol, y silencios
+// ---------------------------------------------------------------------
+
+const NPM_TOKEN = 'npm_' + 'a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8';
+
+test('un npm_ en .npmrc solo da FALLA en secretos-en-arbol; el punto 39 lo nombra como ya contado y queda OK', async () => {
+  await conRepo({ ...NODE, '.npmrc': `//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n` }, async (raiz, opciones) => {
+    const i = informe(raiz, opciones);
+    assert.equal(punto(i, 'secretos-en-arbol').estado, 'falla');
+    const p = punto(i, 'tokens-en-ficheros-de-gestor');
+    assertOk(p);
+    assert.match(p.motivo, /no se cuentan dos veces/);
+    assert.ok(p.evidencias.some((e) => /ya lo cuenta secretos-arbol \(patron npm-token\)/.test(e.descripcion)));
+    // Y si se silencia en secretos-arbol, el 39 no lo resucita.
+    const huella = /huella ([0-9a-f]{12})/.exec(punto(i, 'secretos-en-arbol').evidencias.map((e) => e.descripcion).join(' '))?.[1];
+    assert.ok(huella !== undefined);
+    await escribir(raiz, {
+      '.taskcode/doctor-deploy.yml': `silenciar_1_patron: npm-token\nsilenciar_1_fichero: .npmrc\nsilenciar_1_huella: "${huella}"\nsilenciar_1_motivo: rotado\nsilenciar_1_quien: Ana\nsilenciar_1_fecha: 2026-11-04\n`,
+    });
+    const j = informe(raiz, opciones);
+    assert.equal(punto(j, 'secretos-en-arbol').estado, 'ok');
+    assert.equal(punto(j, 'tokens-en-ficheros-de-gestor').estado, 'ok');
+  });
+});
+
+test('silencios: un hallazgo con huella (token-gestor) y uno por fichero (dockerfile-sin-user) se silencian; otro hallazgo nuevo no', async () => {
+  await conRepo({ ...NODE, '.npmrc': `//registry.npmjs.org/:_authToken=${TOKEN}\n`, Dockerfile: 'FROM node:22\n' }, async (raiz, opciones) => {
+    const i = informe(raiz, opciones);
+    const tok = punto(i, 'tokens-en-ficheros-de-gestor');
+    assert.equal(tok.estado, 'falla');
+    const huella = /patron token-gestor, huella ([0-9a-f]{12})/.exec(tok.evidencias[0]?.descripcion ?? '')?.[1];
+    assert.ok(huella !== undefined, tok.evidencias[0]?.descripcion);
+    assert.match(punto(i, 'dockerfile-sin-user').evidencias[0]?.descripcion ?? '', /\(patron dockerfile-sin-user\)$/);
+    await escribir(raiz, {
+      '.taskcode/doctor-deploy.yml':
+        `silenciar_1_patron: token-gestor\nsilenciar_1_fichero: .npmrc\nsilenciar_1_huella: "${huella}"\nsilenciar_1_motivo: token de solo lectura rotado\nsilenciar_1_quien: Ana\nsilenciar_1_fecha: 2026-11-04\n` +
+        'silenciar_2_patron: dockerfile-sin-user\nsilenciar_2_fichero: Dockerfile\nsilenciar_2_motivo: imagen de pruebas locales\nsilenciar_2_quien: Ana\nsilenciar_2_fecha: 2026-11-04\n',
+    });
+    const j = informe(raiz, opciones);
+    for (const id of ['tokens-en-ficheros-de-gestor', 'dockerfile-sin-user']) {
+      const p = punto(j, id);
+      assert.equal(p.estado, 'ok', `${id}: ${p.motivo}`);
+      assert.ok(p.evidencias.some((e) => /^SILENCIADO \(silenciar_\d/.test(e.descripcion)), id);
+    }
+    // Un token nuevo en otra clave del mismo fichero no queda tapado.
+    await writeFile(path.join(raiz, '.npmrc'), `//registry.npmjs.org/:_authToken=${TOKEN}\n//npm.pkg.github.com/:_authToken=${TOKEN.split('').reverse().join('')}\n`, 'utf8');
+    assert.equal(punto(informe(raiz, opciones), 'tokens-en-ficheros-de-gestor').estado, 'falla');
+  });
+});
+
+// ---------------------------------------------------------------------
+// Enmascarado
+// ---------------------------------------------------------------------
+
+const CON_SECRETOS: Record<string, string> = {
+  ...DOCKER,
+  'docker-compose.yml': `services:\n  db:\n    image: postgres:16\n    environment:\n      POSTGRES_PASSWORD: ${PASS}\n`,
+  '.npmrc': `//registry.npmjs.org/:_authToken=${TOKEN}\n`,
+  '.m2/settings.xml': `<settings><servers><server><id>r</id><password>${PASS}Mvn</password></server></servers></settings>\n`,
+  '.pypirc': `[pypi]\npassword = ${TOKEN}Py\n`,
+};
+
+test('enmascarado: ni la contrasena del compose ni los tokens salen en stdout, JSON, informe en disco ni tarea', async () => {
+  await conRepoDevelop(CON_SECRETOS, async (raiz, opciones) => {
+    const texto = ejecutar(raiz, opciones, []).salida;
+    const json = ejecutar(raiz, opciones, ['--json']).salida;
+    const i = JSON.parse(json) as InformeDeploy;
+    assert.equal(punto(i, 'compose-con-contrasenas').estado, 'falla');
+    assert.equal(punto(i, 'tokens-en-ficheros-de-gestor').estado, 'falla');
+    assert.equal(punto(i, 'tokens-en-ficheros-de-gestor').evidencias.filter((e) => e.muestra !== undefined).length, 3);
+    const completo = await ejecutarCompleto(raiz, opciones, ['--json', '--crear-tareas']);
+    const tareas = path.join(raiz, 'tareas', '00-planificadas');
+    let textoTareas = '';
+    for (const d of await readdir(tareas)) textoTareas += await readFile(path.join(tareas, d, 'tarea.md'), 'utf8');
+    assert.match(textoTareas, /compose-con-contrasenas/);
+    assert.match(textoTareas, /tokens-en-ficheros-de-gestor/);
+    ejecutar(raiz, opciones, ['--escribir']);
+    const docs = path.join(raiz, 'docs', 'doctor-deploy');
+    let textoInforme = '';
+    for (const f of await readdir(docs)) textoInforme += await readFile(path.join(docs, f), 'utf8');
+    assert.match(textoInforme, /compose-con-contrasenas/);
+    for (const [canal, t] of Object.entries({ texto, json, tareas: textoTareas, informe: textoInforme, completo: completo.salida })) {
+      for (const valor of [PASS, TOKEN, `${PASS}Mvn`, `${TOKEN}Py`]) assertSinValor(t, valor, canal);
+    }
+  });
+});
+
+// ---------------------------------------------------------------------
+// El agente ya no los recibe
+// ---------------------------------------------------------------------
+
+test('un veredicto del agente para reglas-firebase-abiertas se rechaza: es un punto determinista', async () => {
+  await conRepo({ ...NODE, 'firestore.rules': firestore('allow read, write: if true;') }, async (raiz, opciones) => {
+    const head = git(['rev-parse', 'HEAD'], raiz);
+    const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-res-'));
+    try {
+      const ruta = path.join(dir, 'resultado.json');
+      const v = { punto: 'reglas-firebase-abiertas', estado: 'ok', commit: head, fichero: 'firestore.rules', linea: 5, motivo: 'Las reglas exigen sesion en todos los documentos' };
+      await writeFile(ruta, JSON.stringify({ veredictos: [v] }), 'utf8');
+      const i = JSON.parse(ejecutar(raiz, opciones, ['--json', '--resultado', ruta]).salida) as InformeDeploy;
+      const p = punto(i, 'reglas-firebase-abiertas');
+      assert.equal(p.estado, 'falla', 'lo decide la sonda, no el agente');
+      assert.equal(p.origen, 'sonda');
+      assert.equal(i.veredictos?.aceptados, 0);
+      assert.ok(i.veredictos?.rechazados.some((x) => x.punto === 'reglas-firebase-abiertas' && /es un punto determinista/.test(x.motivo)));
+    } finally {
+      await rm(dir, { recursive: true, force: true });
+    }
+  });
+});
+
+test('las sondas leen lo versionado: un Dockerfile sin commitear no cuenta', async () => {
+  await conRepo(NODE, async (raiz, opciones) => {
+    await escribir(raiz, { 'Dockerfile.dev': 'FROM node:22\n', 'docker-compose.yml': 'services:\n  a:\n    image: a\n' });
+    await commit(raiz, 'compose');
+    await escribir(raiz, { 'Dockerfile.nuevo': 'FROM node:22\n' });
+    const p = punto(informe(raiz, opciones), 'dockerfile-sin-user');
+    assertFalla(p, 'Dockerfile.dev', /no declara USER/);
+    assert.ok(p.evidencias.every((e) => e.fichero !== 'Dockerfile.nuevo'), 'el no versionado no se mira');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-resultado.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-resultado.test.ts
index f84f6de..c12767a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-resultado.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy-resultado.test.ts
@@ -374,7 +374,7 @@ test('--escribir con --resultado: el informe en .md y .json lleva los veredictos
       assert.match(md, /\| auth-en-servidor \| critica \| juicio \| agente \| OK \|/);
       assert.match(md, /Rechazado \(rls-activo\)/);
       const j = JSON.parse(await readFile(res.rutaJson as string, 'utf8')) as InformeDeploy;
-      assert.equal(j.version, 2);
+      assert.equal(j.version, 3);
       assert.equal(j.veredictos?.aceptados, 1);
       assert.equal(punto(j, PUNTO).origen, 'agente');
       assert.match(res.salida, /Veredictos del agente: 1 aceptado\(s\), 1 rechazado\(s\)/);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
index f416774..ff3a642 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-deploy.test.ts
@@ -639,12 +639,12 @@ test('--json: una linea que pasa JSON.parse, con el contrato (version, commit, r
     assert.ok(r.salida.endsWith('\n'));
     assert.equal(r.salida.trim().split('\n').length, 1);
     const o = JSON.parse(r.salida) as Record<string, unknown>;
-    assert.equal(o['version'], 2);
+    assert.equal(o['version'], 3);
     assert.equal(o['comando'], 'doctor-deploy');
     assert.equal(o['commit'], git(['rev-parse', 'HEAD'], raiz));
     assert.equal(o['rama'], 'main');
     assert.equal(o['arbolSucio'], false);
-    assert.ok(Array.isArray(o['tipos']) && Array.isArray(o['puntos']) && Array.isArray(o['avisos']));
+    assert.ok(Array.isArray(o['tipos']) && Array.isArray(o['aplicaciones']) && Array.isArray(o['puntos']) && Array.isArray(o['avisos']));
     const resumen = o['resumen'] as Record<string, number>;
     assert.equal(resumen['ok']! + resumen['falla']! + resumen['noVerificado']! + resumen['noAplica']!, resumen['total']);
     const p = (o['puntos'] as Array<Record<string, unknown>>)[0] as Record<string, unknown>;
@@ -735,9 +735,9 @@ test('--escribir: informe con commit, rama, tipos y una fila por punto; sin comm
     // Sin restos temporales.
     const archivosInforme = (await readdir(path.join(raiz, 'docs', 'doctor-deploy'))).sort();
     assert.deepEqual(archivosInforme, ['2026-10-27-2.json', '2026-10-27-2.md', '2026-10-27.json', '2026-10-27.md']);
-    // TASK-067: el JSON de al lado es el mismo informe (v2), con el mismo commit.
+    // TASK-067: el JSON de al lado es el mismo informe (v3 desde TASK-068), con el mismo commit.
     const j = JSON.parse(await readFile(r1.rutaJson as string, 'utf8')) as InformeDeploy;
-    assert.equal(j.version, 2);
+    assert.equal(j.version, 3);
     assert.equal(j.commit, hash);
     assert.equal(j.puntos.length, TOTAL_PUNTOS);
     assert.ok(j.puntos.every((p) => p.origen === 'sonda'));
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-aplicaciones.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-aplicaciones.test.ts
new file mode 100644
index 0000000..c6d769e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-aplicaciones.test.ts
@@ -0,0 +1,194 @@
+/**
+ * TASK-068: el tipo de aplicacion como segundo eje del catalogo de
+ * doctor-deploy (familia `aplicacion_N_*` y campo `punto_N_aplicaciones`).
+ * El catalogo real se parsea de verdad; el resto, con catalogos minimos.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import {
+  cargarCatalogoDeploy,
+  DoctorDeployCatalogoError,
+  parsearCapaProyecto,
+  parsearCatalogoDeploy,
+} from '../../src/core/doctor-deploy-catalogo.js';
+
+const BASE = cargarCatalogoDeploy();
+
+/** Los tipos de aplicacion que pide el criterio 1. */
+const APLICACIONES_PEDIDAS = ['web', 'api', 'android', 'ios', 'flutter', 'react-native', 'cli', 'libreria'];
+
+/** Los puntos que nombra el criterio 2. */
+const SEIS_DEL_CRITERIO = ['https-obligatorio', 'cookies-seguras', 'security-headers', 'rate-limits', 'backups-y-migraciones', 'health-check'];
+
+/** Los que ademas se etiquetaron por ser claramente de un servicio desplegado. */
+const ETIQUETADOS_ADEMAS = ['proteccion-de-bots', 'limitar-respuestas-api', 'cors-restringido', 'proteccion-csrf'];
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
+// ---------------------------------------------------------------------
+// Catalogo real
+// ---------------------------------------------------------------------
+
+test('el catalogo real declara los tipos de aplicacion pedidos, con marcadores', () => {
+  const ids = BASE.aplicaciones.map((a) => a.id);
+  for (const id of APLICACIONES_PEDIDAS) assert.ok(ids.includes(id), `falta el tipo de aplicacion "${id}"`);
+  for (const a of BASE.aplicaciones) assert.ok(a.marcadores.length > 0, a.id);
+  // Ningun id de aplicacion coincide con uno de tipo de lenguaje.
+  const idsTipo = new Set(BASE.tipos.map((t) => t.id));
+  for (const id of ids) assert.equal(idsTipo.has(id), false, id);
+});
+
+test('cli, libreria, flutter y react-native exigen un texto dentro del marcador; web no', () => {
+  const de = (id: string) => BASE.aplicaciones.find((a) => a.id === id);
+  assert.ok(de('cli')?.contiene?.includes('"bin"'));
+  assert.ok(de('react-native')?.contiene?.includes('"react-native"'));
+  assert.ok(de('flutter')?.contiene?.includes('sdk: flutter'));
+  assert.ok((de('libreria')?.contiene ?? []).length > 0);
+  assert.equal(de('web')?.contiene, null);
+});
+
+test('los seis puntos del criterio 2 y los cuatro de servicio declaran aplicaciones', () => {
+  for (const id of [...SEIS_DEL_CRITERIO, ...ETIQUETADOS_ADEMAS]) {
+    const p = BASE.puntos.find((x) => x.id === id);
+    assert.ok(p !== undefined, `no hay punto ${id}`);
+    assert.ok(p.aplicaciones !== null, `${id} no declara aplicaciones`);
+    assert.equal(p.aplicaciones.includes('cli'), false, id);
+    assert.equal(p.aplicaciones.includes('libreria'), false, id);
+  }
+});
+
+test('decision de la persona: un punto etiquetado solo se apaga por cli o libreria (incluye web, api y movil)', () => {
+  // Si un punto dejara fuera web, api o un tipo movil, se apagaria tambien con esos marcadores,
+  // y la decision es que solo un marcador de cli o libreria (sin web ni api) lo deja NO APLICA.
+  for (const p of BASE.puntos) {
+    if (p.aplicaciones === null) continue;
+    for (const id of ['web', 'api', 'android', 'ios', 'flutter', 'react-native']) {
+      assert.ok(p.aplicaciones.includes(id), `${p.id} no incluye "${id}"`);
+    }
+  }
+});
+
+test('los puntos que no dependen del tipo de aplicacion no lo declaran (p. ej. los secretos)', () => {
+  for (const id of ['secretos-en-arbol', 'secretos-en-historial', 'dependencias-vulnerables', 'lockfile-versionado']) {
+    assert.equal(BASE.puntos.find((p) => p.id === id)?.aplicaciones, null, id);
+  }
+});
+
+// ---------------------------------------------------------------------
+// Parseo
+// ---------------------------------------------------------------------
+
+const MINIMO = `total_tipos: 1
+total_aplicaciones: 2
+total_puntos: 1
+tipo_1_id: node
+tipo_1_marcadores: [package.json]
+aplicacion_1_id: cli
+aplicacion_1_nombre: CLI
+aplicacion_1_marcadores: [package.json]
+aplicacion_1_contiene: ["\\"bin\\"", "[[bin]]"]
+aplicacion_2_id: web
+aplicacion_2_marcadores: [vite.config.ts]
+punto_1_id: mio
+punto_1_severidad: alta
+punto_1_tipos: [todos]
+punto_1_aplicaciones: [web]
+punto_1_metodo: juicio
+punto_1_arreglo: Arreglalo
+punto_1_descripcion: Algo
+`;
+
+test('un catalogo con aplicaciones parsea: contiene sin comillas de mas, nombre por defecto el id', () => {
+  const c = parsearCatalogoDeploy(MINIMO, 'x.yml');
+  assert.deepEqual(c.aplicaciones, [
+    { id: 'cli', nombre: 'CLI', marcadores: ['package.json'], contiene: ['"bin"', '[[bin]]'] },
+    { id: 'web', nombre: 'web', marcadores: ['vite.config.ts'], contiene: null },
+  ]);
+  assert.deepEqual(c.puntos[0]?.aplicaciones, ['web']);
+});
+
+test('un catalogo sin la familia aplicacion sigue valiendo: sin tipos de aplicacion y puntos sin aplicaciones', () => {
+  const antiguo = MINIMO.replace(/^total_aplicaciones.*\n/m, '')
+    .replace(/^aplicacion_.*\n/gm, '')
+    .replace(/^punto_1_aplicaciones.*\n/m, '');
+  const c = parsearCatalogoDeploy(antiguo, 'x.yml');
+  assert.deepEqual(c.aplicaciones, []);
+  assert.equal(c.puntos[0]?.aplicaciones, null);
+});
+
+test('parser: un id de aplicacion desconocido en un punto aborta y dice los validos', () => {
+  const m = errorDe(() => parsearCatalogoDeploy(MINIMO.replace('punto_1_aplicaciones: [web]', 'punto_1_aplicaciones: [movil]'), 'x.yml'));
+  assert.match(m, /tipo de aplicacion "movil", que no existe/);
+  assert.match(m, /cli, web/);
+});
+
+test('parser: eje equivocado aborta en los dos sentidos', () => {
+  // Un tipo de aplicacion en "tipos".
+  assert.match(
+    errorDe(() => parsearCatalogoDeploy(MINIMO.replace('punto_1_tipos: [todos]', 'punto_1_tipos: [node, cli]'), 'x.yml')),
+    /"cli", que es un tipo de aplicacion, no de lenguaje: va en "punto_1_aplicaciones"/
+  );
+  // Un tipo de lenguaje en "aplicaciones".
+  assert.match(
+    errorDe(() => parsearCatalogoDeploy(MINIMO.replace('punto_1_aplicaciones: [web]', 'punto_1_aplicaciones: [web, node]'), 'x.yml')),
+    /"node", que es un tipo de lenguaje, no de aplicacion: va en "punto_1_tipos"/
+  );
+});
+
+test('parser: "todos" en aplicaciones, o la lista vacia, abortan', () => {
+  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('[web]', '[todos]'), 'x.yml')), /no admite "todos"/);
+  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('punto_1_aplicaciones: [web]', 'punto_1_aplicaciones: []'), 'x.yml')), /lista no vacia/);
+});
+
+test('parser: un id de aplicacion igual a uno de tipo, repetido o mal formado aborta', () => {
+  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('aplicacion_2_id: web', 'aplicacion_2_id: node').replace('[web]', '[cli]'), 'x.yml')), /ya es un tipo de lenguaje/);
+  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('aplicacion_2_id: web', 'aplicacion_2_id: cli'), 'x.yml')), /esta repetido/);
+  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('aplicacion_2_id: web', 'aplicacion_2_id: Web').replace('[web]', '[cli]'), 'x.yml')), /minusculas/);
+});
+
+test('parser: total_aplicaciones que no cuadra, o que falta con entradas, aborta', () => {
+  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('total_aplicaciones: 2', 'total_aplicaciones: 3'), 'x.yml')), /total_aplicaciones/);
+  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace(/^total_aplicaciones.*\n/m, ''), 'x.yml')), /total_aplicaciones" dice 0 \(no esta\)/);
+});
+
+test('parser: contiene vacio, o sin marcadores, aborta', () => {
+  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('aplicacion_1_contiene: ["\\"bin\\"", "[[bin]]"]', 'aplicacion_1_contiene: []'), 'x.yml')), /aplicacion_1_contiene/);
+  assert.match(errorDe(() => parsearCatalogoDeploy(MINIMO.replace('aplicacion_2_marcadores: [vite.config.ts]\n', ''), 'x.yml')), /aplicacion_2_marcadores/);
+});
+
+// ---------------------------------------------------------------------
+// Capa del proyecto
+// ---------------------------------------------------------------------
+
+const base = parsearCatalogoDeploy(MINIMO, 'x.yml');
+const PUNTO_PROYECTO = (lineaExtra: string): string =>
+  'punto_1_id: propio\npunto_1_severidad: baja\npunto_1_tipos: [node]\npunto_1_metodo: juicio\n' +
+  `punto_1_arreglo: Arreglo largo\npunto_1_descripcion: Descripcion larga\n${lineaExtra}`;
+
+test('capa: un punto propio puede declarar aplicaciones validas', () => {
+  const c = parsearCapaProyecto(PUNTO_PROYECTO('punto_1_aplicaciones: [cli]\n'), 'p.yml', base);
+  assert.deepEqual(c.anadidos[0]?.aplicaciones, ['cli']);
+});
+
+test('capa: aplicacion desconocida o del eje equivocado aborta', () => {
+  assert.match(errorDe(() => parsearCapaProyecto(PUNTO_PROYECTO('punto_1_aplicaciones: [escritorio]\n'), 'p.yml', base)), /"escritorio", que no existe/);
+  assert.match(errorDe(() => parsearCapaProyecto(PUNTO_PROYECTO('punto_1_aplicaciones: [node]\n'), 'p.yml', base)), /tipo de lenguaje/);
+  assert.match(
+    errorDe(() => parsearCapaProyecto(PUNTO_PROYECTO('').replace('punto_1_tipos: [node]', 'punto_1_tipos: [web]'), 'p.yml', base)),
+    /tipo de aplicacion, no de lenguaje/
+  );
+});
+
+test('capa: la familia aplicacion no se puede declarar en el proyecto (clave desconocida, aviso)', () => {
+  const c = parsearCapaProyecto('aplicacion_1_id: escritorio\n', 'p.yml', base);
+  assert.equal(c.avisos.length, 1);
+  assert.match(c.avisos[0] as string, /clave desconocida "aplicacion_1_id"/);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-catalogo.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-catalogo.test.ts
index bb7f4f9..c850945 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-catalogo.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-catalogo.test.ts
@@ -10,6 +10,7 @@ import {
   cargarCatalogoDeploy,
   combinarCatalogo,
   DoctorDeployCatalogoError,
+  esSondaRegistrada,
   parsearCapaProyecto,
   parsearCatalogoDeploy,
   resolverRutaCatalogoDeploy,
@@ -60,7 +61,7 @@ const ANADIDOS = [
   'health-check',
   'licencias-de-dependencias',
   'tests-en-verde',
-  // Dominio: su sonda determinista llega en una tarea posterior.
+  // Dominio: deterministas desde TASK-068 (sondas de configuracion).
   'reglas-firebase-abiertas',
   'migraciones-sin-rls',
   'tokens-en-ficheros-de-gestor',
@@ -87,23 +88,83 @@ test('cada punto tiene todos los campos, y los deterministas una sonda registrad
     assert.ok(p.arreglo.length > 10, `${p.id}: arreglo`);
     assert.ok(p.descripcion.length > 10, `${p.id}: descripcion`);
     if (p.metodo === 'determinista') {
-      assert.ok(p.sonda !== null && SONDAS_REGISTRADAS.includes(p.sonda), `${p.id}: sonda`);
+      assert.ok(p.sonda !== null && esSondaRegistrada(p.sonda), `${p.id}: sonda`);
     } else {
       assert.equal(p.sonda, null, `${p.id}: un punto de juicio no lleva sonda`);
     }
   }
 });
 
-test('las sondas registradas y las implementadas son las mismas seis', () => {
+test('las sondas registradas y las implementadas son las mismas, nombradas una a una', () => {
   assert.deepEqual([...SONDAS_REGISTRADAS].sort(), Object.keys(SONDAS).sort());
-  assert.equal(SONDAS_REGISTRADAS.length, 6);
+  assert.deepEqual(
+    [...SONDAS_REGISTRADAS].sort(),
+    [
+      'acciones-sin-sha',
+      'ci-pull-request-target',
+      'compose-contrasenas',
+      'dependencias',
+      'dockerfile-user',
+      'ficheros-secretos',
+      'gitignore-env',
+      'lockfile',
+      'migraciones-rls',
+      'reglas-firebase',
+      'secretos-arbol',
+      'secretos-historial',
+      'tokens-gestor',
+    ]
+  );
   const usadas = new Set(BASE.puntos.flatMap((p) => (p.sonda === null ? [] : [p.sonda])));
   for (const s of SONDAS_REGISTRADAS) assert.ok(usadas.has(s), `ningun punto usa la sonda "${s}"`);
 });
 
-test('solo hay seis puntos deterministas: todo lo demas es de juicio (D6)', () => {
-  const deterministas = BASE.puntos.filter((p) => p.metodo === 'determinista').map((p) => p.id);
-  assert.equal(deterministas.length, 6, deterministas.join(', '));
+/** Los puntos deterministas, por id: los seis de TASK-066 y los siete de configuracion de TASK-068. */
+const DETERMINISTAS: Record<string, string> = {
+  'secretos-en-arbol': 'secretos-arbol',
+  'secretos-en-historial': 'secretos-historial',
+  'ficheros-secretos-versionados': 'ficheros-secretos',
+  'gitignore-cubre-env': 'gitignore-env',
+  'lockfile-versionado': 'lockfile',
+  'dependencias-vulnerables': 'dependencias',
+  'reglas-firebase-abiertas': 'reglas-firebase',
+  'migraciones-sin-rls': 'migraciones-rls',
+  'tokens-en-ficheros-de-gestor': 'tokens-gestor',
+  'compose-con-contrasenas': 'compose-contrasenas',
+  'ci-pull-request-target': 'ci-pull-request-target',
+  'acciones-ci-sin-sha': 'acciones-sin-sha',
+  'dockerfile-sin-user': 'dockerfile-user',
+};
+
+test('los puntos deterministas son exactamente estos, con su sonda: todo lo demas es de juicio (D6)', () => {
+  const deterministas = Object.fromEntries(BASE.puntos.filter((p) => p.metodo === 'determinista').map((p) => [p.id, p.sonda]));
+  assert.deepEqual(deterministas, DETERMINISTAS);
+});
+
+test('TASK-068: los puntos 37 a 43 son deterministas y rls-activo y contenedor-sin-root-ni-secretos siguen de juicio', () => {
+  const ids = ['reglas-firebase-abiertas', 'migraciones-sin-rls', 'tokens-en-ficheros-de-gestor', 'compose-con-contrasenas', 'ci-pull-request-target', 'acciones-ci-sin-sha', 'dockerfile-sin-user'];
+  for (const id of ids) {
+    const p = BASE.puntos.find((x) => x.id === id);
+    assert.ok(p !== undefined, id);
+    assert.equal(p.metodo, 'determinista', id);
+  }
+  for (const id of ['rls-activo', 'contenedor-sin-root-ni-secretos']) {
+    const p = BASE.puntos.find((x) => x.id === id);
+    assert.ok(p !== undefined, id);
+    assert.equal(p.metodo, 'juicio', id);
+    assert.equal(p.sonda, null, id);
+  }
+});
+
+test('TASK-068: un hallazgo por fichero (dockerfile-sin-user, pr-target-checkout) se silencia sin huella; uno con valor, no', () => {
+  const capa = (patron: string): string =>
+    `silenciar_1_patron: ${patron}\nsilenciar_1_fichero: Dockerfile\nsilenciar_1_motivo: imagen de pruebas\nsilenciar_1_quien: Ana\nsilenciar_1_fecha: 2026-11-04\n`;
+  const base: CatalogoBase = { tipos: BASE.tipos, aplicaciones: BASE.aplicaciones, puntos: BASE.puntos };
+  assert.equal(parsearCapaProyecto(capa('dockerfile-sin-user'), 'p.yml', base).silencios.length, 1);
+  assert.equal(parsearCapaProyecto(capa('pr-target-checkout'), 'p.yml', base).silencios.length, 1);
+  for (const patron of ['token-gestor', 'compose-contrasena', 'tabla-sin-rls', 'accion-sin-sha', 'firebase-regla-abierta', 'dockerfile-add-url']) {
+    assert.throws(() => parsearCapaProyecto(capa(patron), 'p.yml', base), /exige "silenciar_1_commit" .* o "silenciar_1_huella"/, patron);
+  }
 });
 
 test('el arreglo de los secretos en git dice rotar primero y reescribir despues', () => {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-referencias.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-referencias.test.ts
new file mode 100644
index 0000000..4b96867
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-referencias.test.ts
@@ -0,0 +1,110 @@
+/**
+ * TASK-068: el campo `referencia` del catalogo real de `doctor-deploy` cita la
+ * version vigente de OWASP Top 10 y ASVS, con un formato uniforme y solo con
+ * categorias y capitulos que existen en esas versiones.
+ *
+ * Las listas oficiales quedan fijadas aqui a proposito: si OWASP publica una
+ * version nueva, este test no cambia solo; hay que volver a verificar contra la
+ * fuente y rehacer el mapeo por significado (las categorias se renumeran).
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { cargarCatalogoDeploy } from '../../src/core/doctor-deploy-catalogo.js';
+
+/**
+ * OWASP Top 10:2025. Fuente: https://top10.owasp.org/2025/ y
+ * https://github.com/OWASP/Top10/tree/master/2025/docs/en (consultadas el
+ * 2026-11-04; https://owasp.org/Top10/ redirige a la edicion 2025).
+ */
+const TOP10_2025: Readonly<Record<string, string>> = {
+  A01: 'Broken Access Control',
+  A02: 'Security Misconfiguration',
+  A03: 'Software Supply Chain Failures',
+  A04: 'Cryptographic Failures',
+  A05: 'Injection',
+  A06: 'Insecure Design',
+  A07: 'Authentication Failures',
+  A08: 'Software or Data Integrity Failures',
+  A09: 'Security Logging and Alerting Failures',
+  A10: 'Mishandling of Exceptional Conditions',
+};
+
+/**
+ * ASVS 5.0.0 (estable, publicada el 30 de mayo de 2025). Fuente:
+ * https://asvs.owasp.org/ y https://github.com/OWASP/ASVS/tree/master/5.0/en
+ * (consultadas el 2026-11-04).
+ */
+const ASVS_5_0: Readonly<Record<string, string>> = {
+  V1: 'Encoding and Sanitization',
+  V2: 'Validation and Business Logic',
+  V3: 'Web Frontend Security',
+  V4: 'API and Web Service',
+  V5: 'File Handling',
+  V6: 'Authentication',
+  V7: 'Session Management',
+  V8: 'Authorization',
+  V9: 'Self-contained Tokens',
+  V10: 'OAuth and OIDC',
+  V11: 'Cryptography',
+  V12: 'Secure Communication',
+  V13: 'Configuration',
+  V14: 'Data Protection',
+  V15: 'Secure Coding and Architecture',
+  V16: 'Security Logging and Error Handling',
+  V17: 'WebRTC',
+};
+
+const FORMATO = /^OWASP Top 10 2025 (A\d\d); ASVS 5\.0 (V\d{1,2})$/;
+
+const PUNTOS = cargarCatalogoDeploy().puntos;
+const CON_REFERENCIA = PUNTOS.filter((p) => p.referencia !== null);
+
+function referenciaDe(id: string): { top10: string; asvs: string } {
+  const punto = PUNTOS.find((p) => p.id === id);
+  assert.ok(punto, `el punto ${id} existe en el catalogo`);
+  const m = FORMATO.exec(punto.referencia ?? '');
+  assert.ok(m, `el punto ${id} tiene referencia con formato: ${String(punto.referencia)}`);
+  return { top10: m[1]!, asvs: m[2]! };
+}
+
+test('ninguna referencia cita la edicion 2021 del Top 10', () => {
+  for (const p of CON_REFERENCIA) {
+    assert.ok(!p.referencia!.includes('2021'), `${p.id}: ${p.referencia}`);
+  }
+});
+
+test('todas las referencias siguen el formato "OWASP Top 10 2025 Axx; ASVS 5.0 Vnn"', () => {
+  assert.ok(CON_REFERENCIA.length > 0);
+  for (const p of CON_REFERENCIA) {
+    assert.match(p.referencia!, FORMATO, p.id);
+  }
+});
+
+test('cada categoria y capitulo citados existen en la lista oficial de su version', () => {
+  for (const p of CON_REFERENCIA) {
+    const m = FORMATO.exec(p.referencia!)!;
+    assert.ok(m[1]! in TOP10_2025, `${p.id}: ${m[1]} no es una categoria del Top 10 2025`);
+    assert.ok(m[2]! in ASVS_5_0, `${p.id}: ${m[2]} no es un capitulo del ASVS 5.0`);
+  }
+});
+
+test('solo licencias-de-dependencias queda sin referencia', () => {
+  const sin = PUNTOS.filter((p) => p.referencia === null && p.origen === 'plugin').map((p) => p.id);
+  assert.deepEqual(sin, ['licencias-de-dependencias']);
+});
+
+test('el mapeo es por significado, no por numero', () => {
+  // Inyeccion: A03 en 2021, A05 en 2025.
+  assert.deepEqual(referenciaDe('queries-parametrizadas'), { top10: 'A05', asvs: 'V1' });
+  // SSRF: A10 en 2021; en 2025 se integra en Broken Access Control (A01).
+  assert.deepEqual(referenciaDe('redirecciones-y-ssrf'), { top10: 'A01', asvs: 'V1' });
+  // Criptografia: A02 en 2021, A04 en 2025.
+  assert.deepEqual(referenciaDe('https-obligatorio'), { top10: 'A04', asvs: 'V12' });
+  assert.deepEqual(referenciaDe('hash-de-contrasenas'), { top10: 'A04', asvs: 'V11' });
+  // Componentes vulnerables: A06 en 2021, Software Supply Chain Failures (A03) en 2025.
+  assert.deepEqual(referenciaDe('dependencias-vulnerables'), { top10: 'A03', asvs: 'V15' });
+  // Errores con traza: nueva categoria A10 de 2025 (CWE-209).
+  assert.deepEqual(referenciaDe('errores-sin-traza'), { top10: 'A10', asvs: 'V16' });
+  // Sesiones: A07 en las dos ediciones, ASVS V7.
+  assert.deepEqual(referenciaDe('caducidad-de-sesion'), { top10: 'A07', asvs: 'V7' });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-reglas.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-reglas.test.ts
new file mode 100644
index 0000000..e6bdb22
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/doctor-deploy-reglas.test.ts
@@ -0,0 +1,394 @@
+/**
+ * TASK-068: los detectores puros de las sondas de configuracion de doctor-deploy
+ * (puntos 37 a 43). Cada uno con su par «detecta» / «no da falso positivo» y las
+ * variantes que un parser linea a linea puede perder (reglas en varias lineas, RLS
+ * en otra migracion, Dockerfile multietapa, CRLF...). La integracion contra repos
+ * Git reales esta en test/commands/doctor-deploy-config.test.ts.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import {
+  condicionAbierta,
+  contrasenaLiteralCompose,
+  detectarAccionesSinSha,
+  detectarContrasenasCompose,
+  detectarDockerfile,
+  detectarFirebaseAbierto,
+  detectarPullRequestTarget,
+  detectarTablasSinRls,
+  detectarTokensGestor,
+  instruccionesDockerfile,
+  nombreTablaSql,
+  PATRON,
+  problemaUses,
+  usaPullRequestTarget,
+  type Detector,
+  type HallazgoRegla,
+} from '../../src/core/doctor-deploy-reglas.js';
+
+const uno = (detector: Detector, ruta: string, contenido: string): HallazgoRegla[] => detector([{ ruta, contenido }]);
+
+/** Ninguna subcadena de 8 o mas caracteres del valor en el texto. */
+function assertSinValor(texto: string, valor: string): void {
+  for (let i = 0; i + 8 <= valor.length; i++) assert.ok(!texto.includes(valor.slice(i, i + 8)), `contiene "${valor.slice(i, i + 8)}"`);
+}
+
+// ---------------------------------------------------------------------
+// 37 reglas-firebase-abiertas
+// ---------------------------------------------------------------------
+
+const firestore = (cuerpo: string): string =>
+  `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /items/{id} {\n${cuerpo}\n    }\n  }\n}\n`;
+
+test('firebase: allow read, write: if true se detecta con su linea y su match', () => {
+  const h = uno(detectarFirebaseAbierto, 'firestore.rules', firestore('      allow read, write: if true;'));
+  assert.equal(h.length, 1);
+  assert.equal(h[0]?.patron, PATRON.firebase);
+  assert.equal(h[0]?.linea, 5);
+  assert.match(h[0]?.descripcion ?? '', /allow read, write en match \/databases\/\{database\}\/documents\/items\/\{id\}/);
+  assert.match(h[0]?.huella ?? '', /^[0-9a-f]{12}$/);
+});
+
+test('firebase: variantes abiertas (sin condicion, separadas, varias lineas, true ||, modo de prueba, CRLF)', () => {
+  const casos: Array<[string, number]> = [
+    ['      allow read, write;', 1],
+    ['      allow read: if true;\n      allow write: if true;', 2],
+    ['      allow read,\n            write\n        : if\n          true;', 1],
+    ['      allow read: if true || request.auth != null;', 1],
+    ['      allow write: if (true);', 1],
+    ['      allow read, write: if request.time < timestamp.date(2030, 1, 1);', 1],
+    ['      allow get, list: if true\n', 1], // sin ; antes de la llave
+  ];
+  for (const [cuerpo, n] of casos) assert.equal(uno(detectarFirebaseAbierto, 'firestore.rules', firestore(cuerpo)).length, n, cuerpo);
+  const crlf = firestore('      allow read, write: if true;').replace(/\n/g, '\r\n');
+  const h = uno(detectarFirebaseAbierto, 'storage.rules', crlf);
+  assert.equal(h.length, 1);
+  assert.equal(h[0]?.linea, 5);
+});
+
+test('firebase: no da falso positivo con reglas que exigen sesion, comentarios ni cadenas con //', () => {
+  const casos = [
+    '      allow read, write: if request.auth != null;',
+    '      allow read: if request.auth.uid == id;',
+    '      // allow read, write: if true;',
+    '      /* allow read, write: if true; */',
+    "      allow read: if resource.data.url.matches('https://.*') && request.auth != null;",
+    '      allow read: if truething == 1;',
+  ];
+  for (const cuerpo of casos) assert.deepEqual(uno(detectarFirebaseAbierto, 'firestore.rules', firestore(cuerpo)), [], cuerpo);
+  // Una cadena con // no se come el resto de la linea: la segunda regla sigue viendose.
+  const h = uno(detectarFirebaseAbierto, 'firestore.rules', firestore("      allow read: if resource.data.u == 'http://x'; allow write: if true;"));
+  assert.equal(h.length, 1);
+  assert.match(h[0]?.descripcion ?? '', /allow write/);
+});
+
+test('firebase: condicionAbierta', () => {
+  assert.equal(condicionAbierta(undefined), 'sin condicion');
+  assert.equal(condicionAbierta(' true '), 'if true');
+  assert.equal(condicionAbierta('((true))'), 'if true');
+  assert.equal(condicionAbierta('(a) || (b)'), null);
+  assert.equal(condicionAbierta('request.auth != null'), null);
+  assert.match(condicionAbierta('request.time < timestamp.date(2024, 5, 1)') ?? '', /modo de prueba/);
+});
+
+test('firebase: database.rules.json con ".read": true (tambien en una ruta anidada y como cadena)', () => {
+  const h = uno(detectarFirebaseAbierto, 'database.rules.json', '{\n  "rules": {\n    ".read": true,\n    ".write": "auth != null",\n    "users": { "$uid": { ".write": "true" } }\n  }\n}\n');
+  assert.equal(h.length, 2);
+  assert.equal(h[0]?.linea, 3);
+  assert.match(h[0]?.descripcion ?? '', /"\.read": true en \//);
+  assert.match(h[1]?.descripcion ?? '', /"\.write": true en \/users\/\$uid/);
+  assert.notEqual(h[0]?.huella, h[1]?.huella);
+});
+
+test('firebase: database.rules.json cerrado no da nada', () => {
+  assert.deepEqual(uno(detectarFirebaseAbierto, 'database.rules.json', '{"rules":{".read":"auth != null",".write":false}}'), []);
+});
+
+// ---------------------------------------------------------------------
+// 38 migraciones-sin-rls
+// ---------------------------------------------------------------------
+
+const M1 = 'supabase/migrations/20240101000000_init.sql';
+const M2 = 'supabase/migrations/20240102000000_rls.sql';
+
+test('rls: una tabla sin enable row level security se detecta en la migracion que la crea', () => {
+  const h = detectarTablasSinRls([{ ruta: M1, contenido: '-- inicio\ncreate table public.perfiles (\n  id uuid primary key\n);\n' }]);
+  assert.equal(h.length, 1);
+  assert.equal(h[0]?.fichero, M1);
+  assert.equal(h[0]?.linea, 2);
+  assert.match(h[0]?.descripcion ?? '', /public\.perfiles/);
+});
+
+test('rls: el RLS activado en una migracion POSTERIOR cuenta (el conjunto, no fichero a fichero), en cualquier orden de entrada', () => {
+  const crear = { ruta: M1, contenido: 'create table perfiles (id int);\n' };
+  const activar = { ruta: M2, contenido: 'alter table public.perfiles enable row level security;\n' };
+  assert.deepEqual(detectarTablasSinRls([crear, activar]), []);
+  assert.deepEqual(detectarTablasSinRls([activar, crear]), []);
+  // Solo la primera migracion: falla.
+  assert.equal(detectarTablasSinRls([crear]).length, 1);
+});
+
+test('rls: mayusculas, comillas y esquema', () => {
+  assert.deepEqual(
+    detectarTablasSinRls([{ ruta: M1, contenido: 'CREATE TABLE IF NOT EXISTS Perfiles (id int);\nALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;\n' }]),
+    []
+  );
+  assert.deepEqual(
+    detectarTablasSinRls([{ ruta: M1, contenido: 'create table public."Users" (id int);\nalter table "public"."Users" enable row level security;\n' }]),
+    []
+  );
+  // "Users" con comillas no es users: sigue sin RLS.
+  const h = detectarTablasSinRls([{ ruta: M1, contenido: 'create table public."Users" (id int);\nalter table public.users enable row level security;\n' }]);
+  assert.equal(h.length, 1);
+  assert.match(h[0]?.descripcion ?? '', /public\.Users/);
+  assert.deepEqual(nombreTablaSql('"Mi"."Tabla"'), { esquema: 'Mi', tabla: 'Tabla' });
+  assert.deepEqual(nombreTablaSql('Tabla'), { esquema: 'public', tabla: 'tabla' });
+});
+
+test('rls: esquemas internos o privados no cuentan; uno propio si', () => {
+  assert.deepEqual(detectarTablasSinRls([{ ruta: M1, contenido: 'create table private.x (id int);\ncreate table auth.y (id int);\n' }]), []);
+  assert.equal(detectarTablasSinRls([{ ruta: M1, contenido: 'create table api.items (id int);\n' }]).length, 1);
+});
+
+test('rls: disable posterior, drop, rename y set schema', () => {
+  const c = (sql: string): number => detectarTablasSinRls([{ ruta: M1, contenido: sql }]).length;
+  assert.equal(c('create table t (id int);\nalter table t enable row level security;\nalter table t disable row level security;\n'), 1);
+  assert.equal(c('create table t (id int);\ndrop table if exists t;\n'), 0);
+  assert.equal(c('create table a (id int);\nalter table a enable row level security;\nalter table a rename to b;\n'), 0);
+  assert.equal(c('create table a (id int);\nalter table a rename to b;\nalter table b enable row level security;\n'), 0);
+  assert.equal(c('create table a (id int);\nalter table a set schema private;\n'), 0);
+  assert.equal(c('create table t (id int);\nalter table t add column x int, enable row level security;\n'), 0);
+});
+
+test('rls: no se deja enganar por comentarios, cadenas, cuerpos $$ ni tablas temporales', () => {
+  const c = (sql: string): number => detectarTablasSinRls([{ ruta: M1, contenido: sql }]).length;
+  assert.equal(c('create table t (id int);\n-- alter table t enable row level security;\n'), 1);
+  assert.equal(c('create table t (id int);\n/* alter table t enable row level security; */\n'), 1);
+  assert.equal(c("insert into notas values ('create table x (id int)');\n"), 0);
+  assert.equal(c('create function f() returns void as $$ begin create table x (id int); end; $$ language plpgsql;\n'), 0);
+  assert.equal(c('create temporary table t (id int);\ncreate temp table u (id int);\n'), 0);
+  // CRLF
+  assert.equal(c('create table t (id int);\r\nalter table t enable row level security;\r\n'), 0);
+});
+
+// ---------------------------------------------------------------------
+// 39 tokens-en-ficheros-de-gestor
+// ---------------------------------------------------------------------
+
+/** Un token que ningun patron generico de secretos-arbol reconoce. */
+const TOKEN_GENERICO = 'Hk3Ns8Qw2Lp5Vx9Rt4Yz7BmQ1';
+const NPM_TOKEN = 'npm_' + 'a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8';
+
+test('tokens: _authToken literal en .npmrc se detecta enmascarado, y los patrones genericos no lo cubren', () => {
+  const h = uno(detectarTokensGestor, '.npmrc', `registry=https://registry.npmjs.org/\n//registry.npmjs.org/:_authToken=${TOKEN_GENERICO}\n`);
+  assert.equal(h.length, 1);
+  assert.equal(h[0]?.patron, PATRON.token);
+  assert.equal(h[0]?.linea, 2);
+  assert.equal(h[0]?.cubiertoPor, undefined);
+  assert.match(h[0]?.descripcion ?? '', /clave \/\/registry\.npmjs\.org\/:_authToken/);
+  assert.match(h[0]?.muestra ?? '', /\*\*\*\* \(25 caracteres\)/);
+  assertSinValor(JSON.stringify(h), TOKEN_GENERICO);
+});
+
+test('tokens: .npmrc con ${NPM_TOKEN}, comentado o sin credencial no da nada', () => {
+  for (const c of ['//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n', `# //r/:_authToken=${TOKEN_GENERICO}\n`, `; _auth=${TOKEN_GENERICO}\n`, 'always-auth=true\n', '_authToken=\n']) {
+    assert.deepEqual(uno(detectarTokensGestor, '.npmrc', c), [], c);
+  }
+});
+
+test('tokens: un npm_ que ya caza secretos-arbol se marca como cubierto (no doble FALLA)', () => {
+  const h = uno(detectarTokensGestor, 'pkg/.npmrc', `_authToken="${NPM_TOKEN}"\n`);
+  assert.equal(h.length, 1);
+  assert.equal(h[0]?.cubiertoPor, 'secretos-arbol (patron npm-token)');
+});
+
+test('tokens: .pypirc con password literal, y %(x)s o ${X} no', () => {
+  const h = uno(detectarTokensGestor, '.pypirc', `[distutils]\nindex-servers = pypi\n\n[pypi]\nusername = __token__\npassword = ${TOKEN_GENERICO}\n`);
+  assert.equal(h.length, 1);
+  assert.equal(h[0]?.linea, 6);
+  assert.match(h[0]?.descripcion ?? '', /\[pypi\] password/);
+  assert.deepEqual(uno(detectarTokensGestor, '.pypirc', '[pypi]\npassword = ${PYPI_TOKEN}\n'), []);
+  assert.deepEqual(uno(detectarTokensGestor, '.pypirc', '[pypi]\npassword = %(token)s\n'), []);
+});
+
+test('tokens: settings.xml de Maven con <password> literal; ${env.X}, cifrada {..}, comentada o fuera de Maven no', () => {
+  const xml = (pw: string): string => `<settings>\n  <servers>\n    <server>\n      <id>central</id>\n      <password>${pw}</password>\n    </server>\n  </servers>\n</settings>\n`;
+  const h = uno(detectarTokensGestor, '.m2/settings.xml', xml('s3cretoMaven99'));
+  assert.equal(h.length, 1);
+  assert.equal(h[0]?.linea, 5);
+  assert.match(h[0]?.descripcion ?? '', /server central <password>/);
+  assertSinValor(JSON.stringify(h), 's3cretoMaven99');
+  assert.deepEqual(uno(detectarTokensGestor, 'settings.xml', xml('${env.MAVEN_PASSWORD}')), []);
+  assert.deepEqual(uno(detectarTokensGestor, 'settings.xml', xml('{COQLCE6DU6GtcS5P=}')), []);
+  assert.deepEqual(uno(detectarTokensGestor, 'settings.xml', '<settings><!-- <password>s3cretoMaven99</password> --></settings>'), []);
+  assert.deepEqual(uno(detectarTokensGestor, 'app/settings.xml', '<config><password>s3cretoMaven99</password></config>'), []);
+});
+
+// ---------------------------------------------------------------------
+// 40 compose-con-contrasenas
+// ---------------------------------------------------------------------
+
+const PASS = 'Pg7xQ2mLw9Zr4Tv8';
+
+test('compose: contrasena literal en forma de mapa y de lista, enmascarada', () => {
+  const yml = `services:\n  db:\n    image: postgres:16\n    environment:\n      POSTGRES_PASSWORD: "${PASS}"\n  cache:\n    environment:\n      - REDIS_PASSWORD=${PASS}\n      - "API_TOKEN=${PASS}" # dev\n`;
+  const h = uno(detectarContrasenasCompose, 'docker-compose.yml', yml);
+  assert.deepEqual(h.map((x) => x.linea), [5, 8, 9]);
+  for (const x of h) {
+    assert.equal(x.patron, PATRON.compose);
+    assert.match(x.muestra ?? '', /\*\*\*\* \(16 caracteres\)/);
+  }
+  assert.match(h[0]?.descripcion ?? '', /POSTGRES_PASSWORD/);
+  assertSinValor(JSON.stringify(h), PASS);
+});
+
+test('compose: ${X}, $X, *_FILE, booleanos, comentarios y claves que no son secretas no cuentan', () => {
+  const yml = [
+    'services:',
+    '  db:',
+    '    image: postgres:16',
+    '    environment:',
+    '      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}',
+    '      POSTGRES_PASSWORD_FILE: /run/secrets/db',
+    '      MYSQL_ALLOW_EMPTY_PASSWORD: "yes"',
+    '      MYSQL_RANDOM_ROOT_PASSWORD: yes',
+    '      DB_PASS: $DB_PASS',
+    '      password: ${DB_PASSWORD:-cambiame}',
+    `      # POSTGRES_PASSWORD: ${PASS}`,
+    '      BYPASS: abcdefghij',
+    '      - TOKEN=${TOKEN}',
+    '      SECRET_KEY: |',
+    '',
+  ].join('\n');
+  assert.deepEqual(uno(detectarContrasenasCompose, 'compose.yaml', yml), []);
+  assert.equal(contrasenaLiteralCompose('POSTGRES_PASSWORD', ' x1 '), 'x1');
+  assert.equal(contrasenaLiteralCompose('POSTGRES_PASSWORD', '1234'), '1234');
+  assert.equal(contrasenaLiteralCompose('POSTGRES_USER', 'admin'), null);
+});
+
+// ---------------------------------------------------------------------
+// 41 ci-pull-request-target
+// ---------------------------------------------------------------------
+
+const PASO_CHECKOUT_PR = '      - uses: actions/checkout@v4\n        with:\n          ref: ${{ github.event.pull_request.head.sha }}\n';
+
+test('pr-target: pull_request_target con checkout del head del PR se detecta (escalar, lista en linea, bloque)', () => {
+  const casos = [
+    `on: pull_request_target\njobs:\n  t:\n    runs-on: ubuntu-latest\n    steps:\n${PASO_CHECKOUT_PR}`,
+    `on: [push, pull_request_target]\njobs:\n  t:\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          ref: \${{ github.head_ref }}\n`,
+    `on:\n  pull_request_target:\n    types: [opened]\njobs:\n  t:\n    steps:\n      - run: gh pr checkout \${{ github.event.number }}\n`,
+    `"on":\n  pull_request_target: {}\njobs:\n  t:\n    steps:\n      - run: git fetch origin pull/\${{ github.event.number }}/head\n`,
+    `on: pull_request_target\r\njobs:\r\n  t:\r\n    steps:\r\n      - uses: actions/checkout@v4\r\n        with:\r\n          ref: refs/pull/\${{ github.event.number }}/merge\r\n`,
+  ];
+  for (const c of casos) {
+    const h = uno(detectarPullRequestTarget, '.github/workflows/ci.yml', c);
+    assert.equal(h.length, 1, c);
+    assert.equal(h[0]?.patron, PATRON.prTarget);
+    assert.equal(h[0]?.huella, null);
+  }
+});
+
+test('pr-target: sin checkout del PR, con pull_request o con el evento comentado no da nada', () => {
+  const casos = [
+    'on: pull_request_target\njobs:\n  t:\n    steps:\n      - uses: actions/checkout@v4\n      - run: echo hola\n',
+    `on: pull_request\njobs:\n  t:\n    steps:\n${PASO_CHECKOUT_PR}`,
+    `# on: pull_request_target\non: push\njobs:\n  t:\n    steps:\n${PASO_CHECKOUT_PR}`,
+  ];
+  for (const c of casos) assert.deepEqual(uno(detectarPullRequestTarget, '.github/workflows/ci.yml', c), [], c);
+  assert.equal(usaPullRequestTarget('on:\n  pull_request_target:\n'), true);
+  assert.equal(usaPullRequestTarget('on: [pull_request_target]'), true);
+  assert.equal(usaPullRequestTarget('on: [pull_request]\n# pull_request_target'), false);
+});
+
+// ---------------------------------------------------------------------
+// 42 acciones-ci-sin-sha
+// ---------------------------------------------------------------------
+
+const SHA = 'a'.repeat(8) + '0123456789abcdef0123456789abcdef';
+
+test('acciones: @v4 de terceros se detecta; SHA, ./local, docker://, actions/ y github/ no', () => {
+  const yml = [
+    'jobs:',
+    '  b:',
+    '    steps:',
+    '      - uses: docker/build-push-action@v5',
+    `      - uses: docker/login-action@${SHA} # v3`,
+    '      - uses: ./.github/actions/local',
+    '      - uses: docker://alpine:3.20',
+    '      - uses: actions/checkout@v4',
+    '      - uses: github/codeql-action/init@v3',
+    '      - uses: "tj-actions/changed-files@main"',
+    '      # - uses: otro/accion@v1',
+    '  reusable:',
+    '    uses: org/repo/.github/workflows/ci.yml@v1',
+    '      - uses: alguien/accion',
+  ].join('\n');
+  const h = uno(detectarAccionesSinSha, '.github/workflows/b.yml', yml);
+  assert.deepEqual(h.map((x) => x.linea), [4, 10, 13, 14]);
+  assert.match(h[0]?.descripcion ?? '', /docker\/build-push-action@v5 fijada a "v5"/);
+  assert.match(h[3]?.descripcion ?? '', /sin version/);
+  assert.notEqual(h[0]?.huella, h[1]?.huella);
+  assert.equal(problemaUses(`x/y@${SHA}`), null);
+  assert.equal(problemaUses(`x/y@${SHA.slice(0, 39)}`) !== null, true, 'un SHA corto no vale');
+});
+
+// ---------------------------------------------------------------------
+// 43 dockerfile-sin-user
+// ---------------------------------------------------------------------
+
+const df = (contenido: string): HallazgoRegla[] => uno(detectarDockerfile, 'Dockerfile', contenido);
+
+test('dockerfile: sin USER se detecta en la linea del FROM final', () => {
+  const h = df('FROM node:22\nWORKDIR /app\nCOPY . .\nCMD ["node", "index.js"]\n');
+  assert.equal(h.length, 1);
+  assert.equal(h[0]?.patron, PATRON.sinUser);
+  assert.equal(h[0]?.linea, 1);
+  assert.equal(h[0]?.huella, null);
+});
+
+test('dockerfile: multietapa con USER solo en el builder FALLA; con USER en la final, no', () => {
+  const builder = 'FROM node:22 AS build\nUSER node\nRUN npm ci\n';
+  const h = df(`${builder}FROM nginx:1.27\nCOPY --from=build /app /usr/share/nginx/html\n`);
+  assert.equal(h.length, 1);
+  assert.equal(h[0]?.linea, 4);
+  assert.match(h[0]?.descripcion ?? '', /etapa final \(FROM nginx:1\.27\)/);
+  assert.deepEqual(df(`${builder}FROM nginx:1.27\nUSER nginx\n`), []);
+});
+
+test('dockerfile: la etapa final hereda el USER de la etapa en que se basa (FROM <alias>)', () => {
+  assert.deepEqual(df('FROM node:22 AS base\nuser app\nFROM base AS final\nCMD ["x"]\n'), []);
+  assert.equal(df('FROM node:22 AS base\nFROM base\nCMD ["x"]\n').length, 1);
+});
+
+test('dockerfile: USER root o 0 en la etapa final FALLA; minusculas valen; imagen nonroot no exige USER', () => {
+  assert.equal(df('FROM alpine\nUSER app\nUSER root\n').length, 1);
+  assert.equal(df('FROM alpine\nUSER 0:0\n').length, 1);
+  assert.deepEqual(df('from alpine\nuser app\n'), []);
+  assert.deepEqual(df('FROM gcr.io/distroless/nodejs22-debian12:nonroot\nCOPY . /app\n'), []);
+});
+
+test('dockerfile: continuacion con \\, CRLF, comentarios, heredoc y directiva escape', () => {
+  // "USER root" dentro de un RUN continuado no es una instruccion USER.
+  assert.equal(df('FROM alpine\r\nRUN echo hola \\\r\n  USER root\r\n').length, 1);
+  assert.deepEqual(df('FROM alpine\r\nRUN apk add \\\r\n  # comentario dentro\r\n  curl\r\nUSER app\r\n'), []);
+  assert.equal(df('FROM alpine\n# USER app\n').length, 1);
+  assert.equal(df('FROM alpine\nRUN <<EOF\nUSER app\nEOF\n').length, 1);
+  assert.deepEqual(df('# escape=`\nFROM alpine\nRUN echo `\n  hola\nUSER app\n'), []);
+  const ins = instruccionesDockerfile('FROM a\nRUN x \\\n  y\nUSER z\n');
+  assert.deepEqual(ins.map((i) => [i.palabra, i.linea]), [['FROM', 1], ['RUN', 2], ['USER', 4]]);
+});
+
+test('dockerfile: ADD de una URL se detecta sin mostrar credenciales ni query; --checksum y ficheros locales no', () => {
+  const h = df('FROM alpine\nADD https://usuario:clave123@ejemplo.org/f.tgz?token=abcdef123 /tmp/\nUSER app\n');
+  assert.equal(h.length, 1);
+  assert.equal(h[0]?.patron, PATRON.addUrl);
+  assert.equal(h[0]?.linea, 2);
+  assert.match(h[0]?.descripcion ?? '', /https:\/\/ejemplo\.org\/f\.tgz/);
+  assert.ok(!(h[0]?.descripcion ?? '').includes('clave123'));
+  assert.ok(!(h[0]?.descripcion ?? '').includes('abcdef123'));
+  assert.deepEqual(df('FROM alpine\nADD --checksum=sha256:abc https://ejemplo.org/f.tgz /tmp/\nADD ./src /app\nUSER app\n'), []);
+});
+
+test('dockerfile: sin ninguna instruccion FROM tambien es un hallazgo', () => {
+  assert.equal(df('# vacio\n').length, 1);
+});
````

## Excluido del diff (16 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-068/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-068/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-068/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-068/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-068/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-068/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-068/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-068/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-068/tarea.md                                                       |   6 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor-deploy.js                              |  44 ++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-catalogo.js                         | 117 ++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-reglas.js                           | 815 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy.js                                  |  16 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/deteccion-app.js                                    |  77 ++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sondas-deploy-config.js                             | 207 +++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/sondas-deploy.js                                    |  32 +++-
 16 files changed, 1286 insertions(+), 28 deletions(-)
````
