# Peticion de brainstorm — TASK-061, rol riesgos (ronda 1)

- Tarea: TASK-061 — Merge request en GitLab autoalojado, tambien en subpath
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-08
- Rol: `brainstorm-riesgos` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-riesgos-1.md`

## Tu pregunta

> ¿Por donde se rompe esto?

## Que miras

- Bordes y estados intermedios: que queda a medias si el proceso muere a mitad.
- Fallos parciales y concurrencia: dos ejecuciones, un recurso ocupado, un permiso denegado.
- Compatibilidad hacia atras con los datos y ficheros que YA existen.
- La vuelta atras: si esto sale mal, como se deshace y que queda inservible.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Que aserciones escribir (es del rol de testing).
- Las reglas de negocio (son del rol de dominio).

## Enunciado de la tarea

### Objetivo

````
El plugin tiene que funcionar en cualquier proyecto con el repo en GitHub o en GitLab (decision de Carlos, 2026-10-08: el repo es publico y lo usara mas gente). Los scripts de Git-Flow y `taskctl` ya son independientes de la plataforma (solo hablan con `origin` por Git). Lo unico atado a la plataforma es `taskctl finish --merge-request` (0.6.0), que reconoce github.com y los hosts que contienen "gitlab" (como gitlab.com), y aborta con "host desconocido" ante cualquier GitLab autoalojado con otro dominio (`git.empresa.com`) o instalado bajo una ruta (`https://servidor/ruta/gitlab`). Hay que poder declarar la plataforma y la URL base de la instancia en `.taskcode/config.yml` para que el merge request funcione contra cualquier GitLab, y que todo siga igual cuando no se declara nada.
````

### Criterios de aceptacion

````
Sin configuracion nueva, `finish --merge-request` se comporta exactamente como en la 0.6.0 (deteccion por host; la suite existente de finish-merge-request sigue en verde sin cambiar expectativas).
`.taskcode/config.yml` permite declarar la plataforma (`github` o `gitlab`) y la URL base de la instancia; un valor invalido aborta como el resto de claves y el CHANGELOG avisa de la compatibilidad con versiones anteriores.
Con una instancia GitLab declarada en un subpath, `finish --merge-request` deduce el proyecto (`grupo/subgrupo/repo`) quitando la URL base a la de origin, tanto en https como en ssh, y abre el MR contra la rama base.
El segundo `finish` consulta el estado del MR en esa misma instancia y cierra o aborta con las mismas reglas que en la 0.6.0 (merged, abierto, cerrado, no se puede saber, commits sin integrar).
Si `glab` no funciona contra una instancia en subpath, la tarea lo deja demostrado con `glab` real y el camino elegido en el plan (API REST o alternativa) lo cubre; el token sale de una variable de entorno y nunca se imprime ni se escribe.
Sin token, sin CLI o con la instancia inalcanzable, aborta antes de subir nada con un mensaje que dice que configurar.
Ninguna URL con credenciales ni ningun token aparece en la salida, en `tarea.md` ni en los commits.
La skill `finish` y el README del plugin explican como configurar un GitLab autoalojado, sin mencionar el proyecto ni rutas internas.
Tests contra repos Git temporales reales y un remoto bare: con el doble de `gh`/`glab` de la suite y, si se usa la API REST, un servidor HTTP local de prueba que imita los endpoints de merge requests (el unico doble nuevo admitido).
````

## Como entregas

Escribe en `salida-brainstorm-riesgos-1.md`, con estas secciones y en este orden:

- Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno
- Estados intermedios y fallos parciales
- Compatibilidad hacia atras
- Vuelta atras
- El riesgo que mas te preocupa (UNO solo)

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
