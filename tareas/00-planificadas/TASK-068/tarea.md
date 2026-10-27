---
id: TASK-068
titulo: "Doctor-deploy C: tipo de aplicacion y sondas deterministas extra"
tipo: feature
sprint: 0
etiquetas: [doctor-deploy, seguridad]
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-068-doctor-deploy-c-tipo-de-aplicacion-y-son
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-10-27
actualizado: 2026-10-27
dependencias: []
---
## Objetivo

Diferido de TASK-066 y TASK-067 por decision de la persona. Que un punto aplique o no depende tambien del tipo de aplicacion (web, API, movil, CLI, libreria), no solo del lenguaje; y hay puntos de seguridad que se pueden medir sin juicio y hoy solo los revisa el agente: reglas de Firebase abiertas, migraciones de Supabase sin RLS, tokens en .npmrc/.pypirc/settings.xml, contrasenas en docker-compose, workflows de CI con pull_request_target o secretos impresos, acciones de CI sin fijar a SHA y Dockerfile sin USER o con ADD de URL. Ademas, fijar la version de las referencias OWASP Top 10 y ASVS (MEN-7 de TASK-066).

## Criterios de aceptacion
- [ ] taskctl doctor-deploy detecta el tipo de aplicacion (web, API, movil Android/iOS/Flutter/React Native, CLI, libreria) ademas del lenguaje, por marcadores declarados en scripts/doctor-deploy.yml, y lo muestra; con test por tipo
- [ ] Los puntos del catalogo declaran a que tipos de aplicacion aplican; en una libreria o CLI, HTTPS, cookies, headers, rate limits, backups y health check salen NO APLICA con motivo
- [ ] Sondas deterministas nuevas, cada una con test que detecta y test que no da falso positivo: reglas Firebase con allow read, write: if true; tablas de migraciones SQL sin enable row level security; tokens en .npmrc, .pypirc o settings.xml versionados; contrasenas literales en docker-compose.yml
- [ ] Sondas de CI y contenedor: workflows con pull_request_target que hacen checkout del PR, acciones de terceros sin fijar a SHA, y Dockerfile sin USER o con ADD de una URL; cada una con test
- [ ] Los puntos que pasan a sonda dejan de ser juicio en el catalogo y el agente de seguridad ya no los recibe; test
- [ ] El campo referencia del catalogo usa la version vigente de OWASP Top 10 y ASVS, verificada contra la fuente oficial y anotada en el Resultado
- [ ] Suite completa con solo los rojos conocidos de Windows; README y CHANGELOG al dia
