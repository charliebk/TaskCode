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
tokens_revision: null
creado: 2026-10-27
actualizado: 2026-11-04
dependencias: []
---
## Objetivo

Diferido de TASK-066 y TASK-067 por decision de la persona. Que un punto aplique o no depende tambien del tipo de aplicacion (web, API, movil, CLI, libreria), no solo del lenguaje; y hay puntos de seguridad que se pueden medir sin juicio y hoy solo los revisa el agente: reglas de Firebase abiertas, migraciones de Supabase sin RLS, tokens en .npmrc/.pypirc/settings.xml, contrasenas en docker-compose, workflows de CI con pull_request_target o secretos impresos, acciones de CI sin fijar a SHA y Dockerfile sin USER o con ADD de URL. Ademas, fijar la version de las referencias OWASP Top 10 y ASVS (MEN-7 de TASK-066).

## Criterios de aceptacion
- [ ] taskctl doctor-deploy detecta el tipo de aplicacion (web, API, movil Android/iOS/Flutter/React Native, CLI, libreria) ademas del lenguaje, por marcadores declarados en scripts/doctor-deploy.yml, y lo muestra; con test por tipo
- [ ] Los puntos del catalogo declaran punto_N_aplicaciones; con doctor-deploy --json, en una fixture de libreria y otra de CLI, https-obligatorio, cookies-seguras, security-headers, rate-limits, backups-y-migraciones y health-check salen no-aplica con un motivo que nombra el tipo, y en una fixture web y otra sin tipo detectado no salen no-aplica; test
- [ ] Sondas deterministas nuevas, cada una con test que detecta y test que no da falso positivo: reglas Firebase con allow read, write: if true; tablas de migraciones SQL sin enable row level security; tokens en .npmrc, .pypirc o settings.xml versionados; contrasenas literales en docker-compose.yml
- [ ] Sondas de CI y contenedor: workflows con pull_request_target que hacen checkout del PR, acciones de terceros sin fijar a SHA, y Dockerfile sin USER o con ADD de una URL; cada una con test
- [ ] Los puntos que pasan a sonda dejan de ser juicio en el catalogo y el agente de seguridad ya no los recibe; test
- [ ] El campo referencia del catalogo usa la version vigente de OWASP Top 10 y ASVS, verificada contra la fuente oficial y anotada en el Resultado
- [ ] Suite completa con solo los rojos conocidos de Windows; README y CHANGELOG al dia

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-03T11:39:42Z | plan | automatico | persona |
| 2026-11-03T12:11:18Z | approve | automatico | automatico |
| 2026-11-03T13:35:58Z | start | automatico | persona |
| 2026-11-04T10:11:08Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-03T12:09:52Z | diseno | agente:ad1a7e7bb38b33839,aaf1a81ad7ac6e846,af05c341271d76ed0,a058c67b68e6e9420 | 90 | 265484 | 2099558 | 43273 | 61 | 2408405 |
| 2026-11-04T10:10:17Z | implementacion | agente:a8415d4a595422892,a504ddf8f0a872ddc,ad1c6279d9c015c18 | 328 | 984708 | 27523989 | 205993 | 42 | 28715018 |
