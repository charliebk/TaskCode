# Peticion al unificador — TASK-061 (ronda 1)

- Tarea: TASK-061 — Merge request en GitLab autoalojado, tambien en subpath
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-08
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (1 puntos): **simple**
- Senales encontradas:
  - criterios_aceptacion: 9 criterios (umbral: 5) (+1)

Los dos niveles NO coinciden. Se lanzan 2 roles, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

## Como consolidas

1. Lee las salidas de arriba. **Si alguna falta o esta sin rellenar, sigue adelante con las que haya y escribe en el plan cual falto**: un plan con un punto de vista menos, dicho, vale mas que un plan que finge estar completo.
2. **No promedies.** Donde dos roles discrepen, el plan dice quien propone que, cual gana y por que. Un desacuerdo resuelto con una frase intermedia que no defiende nadie es la peor salida posible de este paso.
3. **Si no discrepan en nada, eso es la alarma, no la nota de calidad**: significa que los roles recibieron el mismo contexto o que alguno no hizo su trabajo. Dilo en el plan.
4. Cada afirmacion del plan que venga de un rol se atribuye a ese rol.

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Los desacuerdos entre roles y como se resuelve cada uno.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

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
