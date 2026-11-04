---
id: TASK-068
titulo: "Doctor-deploy C: tipo de aplicacion y sondas deterministas extra"
tipo: feature
sprint: 0
etiquetas: [doctor-deploy, seguridad]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-068-doctor-deploy-c-tipo-de-aplicacion-y-son
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 2408405
tokens_implementacion: 28715018
tokens_revision: 16493120
creado: 2026-10-27
actualizado: 2026-11-04
dependencias: []
---
## Objetivo

Diferido de TASK-066 y TASK-067 por decision de la persona. Que un punto aplique o no depende tambien del tipo de aplicacion (web, API, movil, CLI, libreria), no solo del lenguaje; y hay puntos de seguridad que se pueden medir sin juicio y hoy solo los revisa el agente: reglas de Firebase abiertas, migraciones de Supabase sin RLS, tokens en .npmrc/.pypirc/settings.xml, contrasenas en docker-compose, workflows de CI con pull_request_target o secretos impresos, acciones de CI sin fijar a SHA y Dockerfile sin USER o con ADD de URL. Ademas, fijar la version de las referencias OWASP Top 10 y ASVS (MEN-7 de TASK-066).

## Criterios de aceptacion
- [x] taskctl doctor-deploy detecta el tipo de aplicacion (web, API, movil Android/iOS/Flutter/React Native, CLI, libreria) ademas del lenguaje, por marcadores declarados en scripts/doctor-deploy.yml, y lo muestra; con test por tipo
- [x] Los puntos del catalogo declaran punto_N_aplicaciones; con doctor-deploy --json, en una fixture de libreria y otra de CLI, https-obligatorio, cookies-seguras, security-headers, rate-limits, backups-y-migraciones y health-check salen no-aplica con un motivo que nombra el tipo, y en una fixture web y otra sin tipo detectado no salen no-aplica; test
- [x] Sondas deterministas nuevas, cada una con test que detecta y test que no da falso positivo: reglas Firebase con allow read, write: if true; tablas de migraciones SQL sin enable row level security; tokens en .npmrc, .pypirc o settings.xml versionados; contrasenas literales en docker-compose.yml
- [x] Sondas de CI y contenedor: workflows con pull_request_target que hacen checkout del PR, acciones de terceros sin fijar a SHA, y Dockerfile sin USER o con ADD de una URL; cada una con test
- [x] Los puntos que pasan a sonda dejan de ser juicio en el catalogo y el agente de seguridad ya no los recibe; test
- [x] El campo referencia del catalogo usa la version vigente de OWASP Top 10 y ASVS, verificada contra la fuente oficial y anotada en el Resultado
- [x] Suite completa con solo los rojos conocidos de Windows; README y CHANGELOG al dia

## Resultado

Implementado en tres frentes en paralelo (worktrees propios) e integrado en la rama:

- **Clase de aplicacion** (criterios 1 y 2): familia `aplicacion_N_{id,nombre,marcadores,contiene}` en `scripts/doctor-deploy.yml` (web, api, android, ios, flutter, react-native, cli, libreria), `detectarAplicaciones` en `src/fs/deteccion-app.ts`, `punto_N_aplicaciones` combinado con `punto_N_tipos` con Y (y O dentro de cada eje) en `evaluarPunto`. Sin clase detectada, el punto aplica (decision 1 de la persona); solo sale NO APLICA con cli o libreria y ninguna senal de web o api, con el tipo y el marcador en el motivo. Etiquetados los seis puntos del criterio 2 mas proteccion-de-bots, limitar-respuestas-api, cors-restringido y proteccion-csrf. JSON `version: 3` con `aplicaciones`. Evidencia: `test/core/doctor-deploy-aplicaciones.test.ts` y `test/commands/doctor-deploy-aplicaciones.test.ts` (una fixture por tipo con su estructura real, negativos, criterio 2 literal con `--json`, interseccion de ejes); sobre este repo, `doctor-deploy` detecta `cli` por `package.json contiene "bin"` y apaga los diez puntos con ese motivo.
- **Siete sondas deterministas** (criterios 3, 4 y 5): `reglas-firebase`, `migraciones-rls`, `tokens-gestor`, `compose-contrasenas`, `ci-pull-request-target`, `acciones-sin-sha` y `dockerfile-user`, con detectores puros en `src/core/doctor-deploy-reglas.ts` y lectura en `src/fs/sondas-deploy-config.ts`. Los puntos 37 a 43 pasan a `metodo: determinista`; el agente solo recibe los de juicio y un veredicto suyo para ellos se rechaza (test). Sin ficheros, NO APLICA con motivo (decision 2); fichero ilegible o demasiado grande, NO VERIFICADO. Secretos enmascarados en todos los canales; un token que ya cuenta `secretos-arbol` no da doble FALLA. Silencios por hallazgo. Evidencia: `test/core/doctor-deploy-reglas.test.ts` y `test/commands/doctor-deploy-config.test.ts` (par detecta / no da falso positivo por sonda contra repos Git temporales).
- **Referencias** (criterio 6): las 42 referencias pasan a `OWASP Top 10 2025 Axx; ASVS 5.0 Vnn`, remapeadas por significado. Verificado el 2026-11-04 en la fuente oficial: https://owasp.org/Top10/ (redirige a https://top10.owasp.org/2025/; categorias A01..A10 tambien en github.com/OWASP/Top10, carpeta 2025) y https://asvs.owasp.org/ («Stable release, Published 30 May 2025», capitulos V1..V17 en github.com/OWASP/ASVS, tag v5.0.0). licencias-de-dependencias sigue sin referencia (ningun estandar trata licencias). Tabla completa y casos dudosos en `docs/doctor-deploy-referencias-owasp.md`; test `test/core/doctor-deploy-referencias.test.ts`.
- **Suite y documentacion** (criterio 7): `npm test` tras las correcciones de la ronda 1: 1710 tests, 1705 pasan; los 5 rojos son los conocidos de Windows (approve/symlink EPERM, plan/chmod, plan/CRLF) y las dos contrapruebas de descubrimiento de TASK-075. README del plugin y CHANGELOG al dia, con el aviso de que el JSON pasa a v3 y de que un CI que use `doctor-deploy` como puerta puede ponerse rojo al actualizar porque los puntos 37-43 ahora pueden dar FALLA.

Fuera de alcance por decision de la persona: «secretos impresos en CI» (decision 3).

### Revision por pares

- **Ronda 1** (cambios solicitados): IMP-1 una API con `bin` y un framework fuera de la lista salia solo `cli` y perdia diez puntos; IMP-2 las sondas 40 y 43 no miraban `Dockerfile.prod`, `Containerfile` ni `compose.prod.yaml` porque el tipo docker no se detectaba; IMP-3 un silencio de `pr-target-checkout` tapaba pasos peligrosos nuevos del mismo flujo. Corregidos: senales de servicio independientes del framework (`EXPOSE`, `ports:`, Procfile `web:`) y mas frameworks como api; puntos 40 y 43 a `tipos: [todos]`; huella por paso en `pr-target-checkout`. Tambien MEN-1 (`SECRET_KEY` y afines en compose), MEN-2 (el evento nombrado en un `if:` no cuenta), MEN-4 (CHANGELOG) y la mitad de MEN-5 (exclusion `_file` muerta). Todo con tests.
- **Ronda 2** (aprobada con correcciones): las correcciones verificadas empiricamente, sin regresiones, sin CRITICO ni IMPORTANTE abiertos.

### MENOR aceptados (no se corrigen)

- **MEN-3**: `ci-pull-request-target` no detecta `repository: ${{ github.event.pull_request.head.repo.full_name }}` sin `ref`, ni un `ref: |` multilinea. Limite conocido del analisis linea a linea, aceptado en el plan.
- **MEN-5**: el limite exacto de `maxBytesFichero` (`>` frente a `>=`) no tiene test; diferencia de un byte sin efecto practico.
- **MEN-6**: la deteccion de api es por subcadena, asi que «Supports: linux» o un autor «Tidelift» pueden dar `api` y encender los puntos en una CLI. Es la direccion segura (decision 1); en una muestra de 645 `package.json`, el 7,7 % da alguna senal api, casi todos por frameworks reales.
- **MEN-7**: la estabilidad de la huella de `pr-target-checkout` ante espacios esta comprobada a mano en la ronda 2 pero sin test propio.
- **MEN-8**: el mismo paso identico en dos jobs comparte huella; silenciar uno tapa el otro. Borde del diseno de huella por linea normalizada.
- **Del plan, sin cubrir**: el rol dominio no se lanzo; un tipo movil nunca apaga puntos por la decision 1.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-03T11:39:42Z | plan | automatico | persona |
| 2026-11-03T12:11:18Z | approve | automatico | automatico |
| 2026-11-03T13:35:58Z | start | automatico | persona |
| 2026-11-04T10:11:08Z | review | automatico | persona |
| 2026-11-04T11:35:23Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-03T12:09:52Z | diseno | agente:ad1a7e7bb38b33839,aaf1a81ad7ac6e846,af05c341271d76ed0,a058c67b68e6e9420 | 90 | 265484 | 2099558 | 43273 | 61 | 2408405 |
| 2026-11-04T10:10:17Z | implementacion | agente:a8415d4a595422892,a504ddf8f0a872ddc,ad1c6279d9c015c18 | 328 | 984708 | 27523989 | 205993 | 42 | 28715018 |
| 2026-11-04T11:07:57Z | revision | agente:a5190374e0e49bbdb | 144 | 613765 | 11274535 | 47893 | 5 | 11936337 |
| 2026-11-04T12:23:52Z | revision | agente:a688477706b5dc09c | 74 | 423153 | 4108428 | 25128 | 7 | 4556783 |
