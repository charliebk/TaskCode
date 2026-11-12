# Peticion de brainstorm — TASK-110, rol arquitectura (ronda 1)

- Tarea: TASK-110 — Progreso visible sin tokens: estado de cada fase en el terminal
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-12
- Rol: `brainstorm-arquitectura` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-arquitectura-1.md`

## Tu pregunta

> Dado lo que ya existe, ¿donde encaja este cambio y que forma tiene?

## Que miras

- Los modulos y ficheros que ya resuelven algo parecido, para extenderlos en vez de duplicarlos.
- Que se crea nuevo, que se extiende y en que orden se construye.
- Los limites que el cambio cruza: contratos publicos, formatos de fichero, esquemas.
- El precedente interno mas cercano: como se resolvio la ultima vez un problema de esta forma.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Como se prueba (es del rol de testing).
- Por donde se rompe (es del rol de riesgos).
- Las reglas de negocio (son del rol de dominio).

## Enunciado de la tarea

### Objetivo

````
Mientras taskctl y sus hooks trabajan (la verificacion de finish, unos 28 min en ToolsaWeb; el freno Stop; las rondas de revision; la suite de 25 min) la persona no ve en que paso van y pregunta al agente cada pocos minutos, lo que gasta tokens. taskctl escribe el estado de la tarea en curso (fase, paso, x/N, tiempo) y la persona lo ve sin pasar por el agente.
````

### Criterios de aceptacion

````
plan, approve, start, review, finish y el freno Stop escriben en .git/taskcode/progreso.json la tarea, la fase, el paso, x/N si lo hay y el instante de inicio, y lo marcan como terminado al acabar (un test con repo temporal por comando)
taskctl estado imprime TASK-NNN · <fase> · <paso> x/N · <mm> min leyendo solo ese fichero, sin lanzar git y en menos de 200 ms (test)
taskctl estado --seguir refresca cada segundo hasta que la fase termina (test con un fichero que cambia)
El comando de verificacion recibe TASKCTL_PROGRESO con la ruta de un fichero; si escribe x/N en el, taskctl estado lo muestra (test con un script que lo escribe)
taskctl doctor ofrece instalar una status line de Claude Code que muestra taskctl estado, y solo la instala con un flag explicito (test sobre un settings.json temporal)
npm test de TaskCode muestra [x/N] mientras corre, con un reporter sin dependencias y el total de la ejecucion anterior (test del reporter)
Sin tarea en curso, taskctl estado dice que no hay nada en marcha y sale con 0 (test)
La suite completa pasa (npm test) sin debilitar ningun test
````

## Como entregas

Escribe en `salida-brainstorm-arquitectura-1.md`, con estas secciones y en este orden:

- Enfoque propuesto, con rutas y nombres concretos
- Que se extiende y que se crea
- Limites que cruza
- La decision de diseño que mas te preocupa (UNA sola)

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **riesgos**, **testing**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
