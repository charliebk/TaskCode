# Referencias OWASP del catálogo de `doctor-deploy`

TASK-068 sustituye las referencias «OWASP Top 10 2021 Axx» de
`scripts/doctor-deploy.yml` por la versión vigente del OWASP Top 10 y del ASVS.
El mapeo se ha rehecho **por significado**, no por número: entre 2021 y 2025 las
categorías se renumeran (criptografía pasa de A02 a A04, inyección de A03 a A05,
SSRF deja de ser A10 y se integra en A01…).

Formato uniforme del campo: `OWASP Top 10 2025 Axx; ASVS 5.0 Vnn`, con la
categoría del Top 10 y el capítulo del ASVS que mejor cubren el punto.

## Fuentes consultadas (2026-11-04)

| Dato | URL | Lo que dice |
|---|---|---|
| Versión vigente del Top 10 | https://owasp.org/Top10/ → 308 a https://top10.owasp.org/ → redirige a `2025/en/` | La edición vigente es **OWASP Top 10:2025** |
| Categorías del Top 10 2025 | https://top10.owasp.org/2025/ y https://github.com/OWASP/Top10/tree/master/2025/docs/en | A01..A10, lista de abajo |
| Cambios respecto a 2021 | https://top10.owasp.org/2025/0x00_2025-Introduction/ | SSRF se integra en A01; A03 amplía «Vulnerable and Outdated Components»; A10 es nueva |
| CWE por categoría | Páginas `https://top10.owasp.org/2025/A0N_2025-*/` | Ver la columna «razón» |
| Versión vigente del ASVS | https://owasp.org/asvs → 308 a https://asvs.owasp.org/ | **ASVS 5.0.0**, «Stable release», publicada el 30 de mayo de 2025 |
| Nada estable más nuevo | https://github.com/OWASP/ASVS/releases | Tras 5.0.0 solo hay la build «Bleeding Edge» (tag `latest`, 2026-10-26), que el propio repo marca como no estable |
| Capítulos del ASVS 5.0 | https://github.com/OWASP/ASVS/tree/master/5.0/en | V1..V17, lista de abajo |
| Secciones usadas | `https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x1N-V*.md` (V1, V2, V3, V11, V13, V14, V15, V16) | Ver la columna «razón» |

No verificado: la página del Top 10 2025 no indica fecha de publicación (solo
«2021-2025» en el copyright); se da por vigente porque la portada oficial
redirige a ella.

**OWASP Top 10:2025** — A01 Broken Access Control · A02 Security
Misconfiguration · A03 Software Supply Chain Failures · A04 Cryptographic
Failures · A05 Injection · A06 Insecure Design · A07 Authentication Failures ·
A08 Software or Data Integrity Failures · A09 Security Logging and Alerting
Failures · A10 Mishandling of Exceptional Conditions.

**ASVS 5.0** — V1 Encoding and Sanitization · V2 Validation and Business Logic ·
V3 Web Frontend Security · V4 API and Web Service · V5 File Handling ·
V6 Authentication · V7 Session Management · V8 Authorization · V9 Self-contained
Tokens · V10 OAuth and OIDC · V11 Cryptography · V12 Secure Communication ·
V13 Configuration · V14 Data Protection · V15 Secure Coding and Architecture ·
V16 Security Logging and Error Handling · V17 WebRTC.

## Mapeo

Prefijo común omitido: «OWASP Top 10 2021» en la vieja, «OWASP Top 10 2025 … ;
ASVS 5.0 …» en la nueva. (D) = caso dudoso, comentado abajo.

| # | Punto | Vieja | Nueva | Razón |
|---|---|---|---|---|
| 1 | secretos-en-arbol | A02 | A07; V13 | (D) Credenciales escritas en el código: CWE-798/259 están en A07:2025; ASVS 13.3 Secret Management |
| 2 | secretos-en-historial | A02 | A07; V13 | (D) Igual que el 1, en el historial |
| 3 | ficheros-secretos-versionados | A05 | A02; V13 | Configuración: CWE-260 (contraseña en fichero de configuración) en A02; 13.3 |
| 4 | gitignore-cubre-env | A05 | A02; V13 | Igual que el 3 |
| 5 | clave-publica-en-cliente-db | A01 | A01; V8 | Una clave de servicio en el cliente salta la autorización |
| 6 | rls-activo | A01 | A01; V8 | Control de acceso por fila |
| 7 | cifrado-en-reposo | A02 | A04; V14 | Criptografía pasa a A04; el cifrado en reposo está en 14.1.2 (V11 no lo trata) |
| 8 | auth-en-servidor | A01 | A01; V8 | Autorización en una capa de confianza (V8.3) |
| 9 | restringir-accesos | A01 | A01; V8 | Mínimo privilegio |
| 10 | mass-assignment | A04 | A08; V15 | (D) CWE-915 está mapeada a A08:2025, no a A06; ASVS 15.3.3 |
| 11 | cookies-seguras | A05 | A02; V3 | CWE-614/1004 en A02:2025; ASVS 3.3 Cookie Setup |
| 12 | hash-de-contrasenas | A02 | A04; V11 | CWE-916 en A04:2025; ASVS 11.4.2 |
| 13 | rate-limits | A04 | A06; V2 | Insecure Design pasa a A06 (CWE-799); ASVS 2.4 Anti-automation |
| 14 | proteccion-de-bots | A04 | A06; V2 | Igual que el 13 (2.4.2) |
| 15 | queries-parametrizadas | A03 | A05; V1 | Inyección pasa a A05 (CWE-89); ASVS 1.2.4 |
| 16 | validacion-de-inputs | A03 | A05; V2 | CWE-20 en A05:2025; validación con esquema en 2.2 (el escape de salida es V1) |
| 17 | fuga-de-contenido | A01 | A01; V8 | IDOR: control de acceso |
| 18 | uploads-seguros | A04 | A06; V5 | CWE-434 en A06:2025; ASVS V5 File Handling |
| 19 | limitar-respuestas-api | A01 | A01; V15 | Exposición de datos; ASVS 15.3.1 (devolver solo los campos necesarios) |
| 20 | security-headers | A05 | A02; V3 | Configuración; ASVS 3.4 Browser Security Mechanism Headers |
| 21 | https-obligatorio | A02 | A04; V12 | CWE-319 en A04:2025; ASVS V12 Secure Communication |
| 22 | dependencias-vulnerables | A06 | A03; V15 | A03:2025 amplía la antigua A06 (CWE-1395); ASVS 15.2.1 |
| 23 | cors-restringido | A05 | A02; V3 | CWE-942 en A02:2025; ASVS 3.4.2 |
| 24 | proteccion-csrf | A01 | A01; V3 | CWE-352 en A01:2025; ASVS 3.5 Browser Origin Separation |
| 25 | debug-y-source-maps | A05 | A02; V13 | CWE-489 en A02:2025; ASVS 13.4.2 |
| 26 | variables-entorno-documentadas | A05 | A02; V13 | Configuración; ASVS 13.1 Configuration Documentation |
| 27 | lockfile-versionado | A08 | A03; V15 | (D) Cadena de suministro: elegir y fijar versiones de dependencias; ASVS 15.2.4 |
| 28 | contenedor-sin-root-ni-secretos | A05 | A02; V13 | Configuración del despliegue; ASVS 13.2.2 y 13.3 |
| 29 | logs-sin-datos-sensibles | A09 | A09; V16 | CWE-532 en A09:2025; ASVS 16.2.5 |
| 30 | errores-sin-traza | A05 | A10; V16 | CWE-209/550 en la nueva A10:2025; ASVS 16.5.1 |
| 31 | redirecciones-y-ssrf | A10 | A01; V1 | SSRF (CWE-918) y open redirect (CWE-601) en A01:2025; SSRF en ASVS 1.3.6 (las redirecciones, en 3.7) |
| 32 | caducidad-de-sesion | A07 | A07; V7 | CWE-613 en A07:2025; ASVS V7 Session Management |
| 33 | backups-y-migraciones | A04 | A06; V14 | (D) Insecure Design pasa a A06; el ASVS 5.0 no tiene requisito de copias de seguridad |
| 34 | health-check | A09 | A02; V13 | (D) Lo comprobable es que no revele información interna: ASVS 13.4.5 (endpoints de monitorización expuestos) |
| 35 | licencias-de-dependencias | — | — | Sin referencia, a propósito (ver abajo) |
| 36 | tests-en-verde | A08 | A08; V15 | (D) Integridad de lo que se publica; ningún capítulo del ASVS pide tests |
| 37 | reglas-firebase-abiertas | A01 | A01; V8 | Control de acceso a los datos |
| 38 | migraciones-sin-rls | A01 | A01; V8 | Igual que el 6 |
| 39 | tokens-en-ficheros-de-gestor | A02 | A02; V13 | CWE-260 en A02:2025 (aquí A02 es otra categoría que en 2021); ASVS 13.3 |
| 40 | compose-con-contrasenas | A05 | A02; V13 | CWE-260 en A02:2025; ASVS 13.3 |
| 41 | ci-pull-request-target | A08 | A03; V15 | (D) A03:2025 trata expresamente la seguridad del CI/CD y del servidor de build |
| 42 | acciones-ci-sin-sha | A08 | A03; V15 | (D) Código de terceros en el build; ASVS 15.2.4 |
| 43 | dockerfile-sin-user | A05 | A02; V13 | Configuración del contenedor; ASVS 13.2.2 |

## Casos dudosos

- **1–2 secretos en el árbol y en el historial (A07).** Las credenciales
  escritas en el código (CWE-798, CWE-259) están mapeadas a A07:2025; las
  claves criptográficas escritas (CWE-321), a A04; las contraseñas en
  ficheros de configuración (CWE-260), a A02. Se elige A07 porque lo que el
  punto busca son sobre todo API keys y tokens. Para los puntos de ficheros de
  configuración (3, 4, 39, 40) se elige A02 por CWE-260.
- **10 mass-assignment (A08).** Por significado encajaría en control de acceso,
  pero el mapeo oficial de CWE-915 es A08:2025. Se sigue a la fuente.
- **27 lockfile, 41 pull_request_target y 42 acciones sin SHA (A03).** A08:2025
  también cita CI/CD sin comprobaciones de integridad (y CWE-829, CWE-494). Se
  elige A03 porque su texto trata expresamente el CI/CD y las dependencias como
  cadena de suministro. El ASVS 5.0 no tiene requisitos de CI; V15
  (dependencias y arquitectura) es lo más cercano.
- **33 backups-y-migraciones (V14).** El ASVS 5.0 no pide copias de
  seguridad; V14 Data Protection es el capítulo más cercano (14.2.7,
  retención).
- **34 health-check (A02 en vez de A09).** Lo que el punto comprueba es que el
  endpoint no revele información interna, que es configuración (ASVS 13.4.5).
- **36 tests-en-verde (V15).** Ningún capítulo del ASVS pide que la suite pase;
  V15 es lo más cercano.

## Punto 35 licencias-de-dependencias: sin referencia

Se deja sin referencia a propósito. Ni el OWASP Top 10 2025 ni el ASVS 5.0
tratan la compatibilidad de licencias. La página de A03:2025 habla de
dependencias vulnerables y comprometidas, no de licencias, y el inventario de
componentes de ASVS 15.1.2 tampoco las pide. Citar una categoría sería forzar el
dato. El campo es opcional en el catálogo, y un test comprueba que este es el
único punto base sin referencia.
