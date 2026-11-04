# Peticion de brainstorm — TASK-068, rol testing (ronda 1)

- Tarea: TASK-068 — Doctor-deploy C: tipo de aplicacion y sondas deterministas extra
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-03
- Rol: `brainstorm-testing` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-testing-1.md`

## Tu pregunta

> ¿Como se demuestra que esto funciona, y como envejece?

## Que miras

- Que es observable desde fuera, y contra que recurso real se comprueba.
- Para cada prueba propuesta, LA MUTACION DEL CODIGO FUENTE QUE LA PONDRIA ROJA. Si no sabes decirla, esa prueba no vale.
- Que pruebas ya existentes cambian de expectativa y cuales siguen valiendo de red de regresion.
- Como envejece: que se rompe dentro de seis meses cuando alguien extienda esto.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Por donde se rompe en produccion (es del rol de riesgos).
- Las reglas de negocio (son del rol de dominio).

## Enunciado de la tarea

### Objetivo

````
Diferido de TASK-066 y TASK-067 por decision de la persona. Que un punto aplique o no depende tambien del tipo de aplicacion (web, API, movil, CLI, libreria), no solo del lenguaje; y hay puntos de seguridad que se pueden medir sin juicio y hoy solo los revisa el agente: reglas de Firebase abiertas, migraciones de Supabase sin RLS, tokens en .npmrc/.pypirc/settings.xml, contrasenas en docker-compose, workflows de CI con pull_request_target o secretos impresos, acciones de CI sin fijar a SHA y Dockerfile sin USER o con ADD de URL. Ademas, fijar la version de las referencias OWASP Top 10 y ASVS (MEN-7 de TASK-066).
````

### Criterios de aceptacion

````
taskctl doctor-deploy detecta el tipo de aplicacion (web, API, movil Android/iOS/Flutter/React Native, CLI, libreria) ademas del lenguaje, por marcadores declarados en scripts/doctor-deploy.yml, y lo muestra; con test por tipo
Los puntos del catalogo declaran a que tipos de aplicacion aplican; en una libreria o CLI, HTTPS, cookies, headers, rate limits, backups y health check salen NO APLICA con motivo
Sondas deterministas nuevas, cada una con test que detecta y test que no da falso positivo: reglas Firebase con allow read, write: if true; tablas de migraciones SQL sin enable row level security; tokens en .npmrc, .pypirc o settings.xml versionados; contrasenas literales en docker-compose.yml
Sondas de CI y contenedor: workflows con pull_request_target que hacen checkout del PR, acciones de terceros sin fijar a SHA, y Dockerfile sin USER o con ADD de una URL; cada una con test
Los puntos que pasan a sonda dejan de ser juicio en el catalogo y el agente de seguridad ya no los recibe; test
El campo referencia del catalogo usa la version vigente de OWASP Top 10 y ASVS, verificada contra la fuente oficial y anotada en el Resultado
Suite completa con solo los rojos conocidos de Windows; README y CHANGELOG al dia
````

## Como entregas

Escribe en `salida-brainstorm-testing-1.md`, con estas secciones y en este orden:

- Que es observable sin llamar a ningun agente
- Plan de pruebas, cada una con su mutacion
- Aserciones trampa que hay que evitar en esta tarea concreta
- Que pruebas existentes cambian de expectativa
- Como envejece

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **riesgos**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
