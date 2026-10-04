# Peticion de brainstorm — TASK-055, rol riesgos (ronda 1)

- Tarea: TASK-055 — Flujo guiado por fases con modos manual, semiautomatico y automatico
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-10-04
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
Hoy el plugin solo trae el CLI, la skill y los agentes: no hay comandos de fase ni hooks, ninguna fase avanza sola ni pregunta, y fuera de Claude Code taskctl ni siquiera arranca en PowerShell. El objetivo es que el plugin conduzca el ciclo plan, approve, start, review y finish dentro de Claude Code, con un comando por fase para reanudar en cualquier sesion y un modo de flujo configurable: manual (la persona lanza cada comando), semiautomatico (al cerrar cada fase pregunta si seguir; un no deja la tarea en su estado) y automatico (todas las preguntas se hacen en plan y el resto corre sin preguntar hasta finish). En los tres modos se conservan las garantias: revision independiente, mejor skill, segunda opinion, ramas que no se pisan y un historico en Git de todo lo planificado y ejecutado.
````

### Criterios de aceptacion

````
taskctl arranca desde PowerShell y cmd en Windows (bin/taskctl.cmd) y el README explica como usarlo fuera de Claude Code
El plugin trae un comando por fase (/taskcode:plan, approve, start, review, finish, mas new y board) que ejecuta el taskctl de esa fase y el trabajo de agentes que le toca
Clave modo_flujo en .taskcode/config.yml con valores manual, semiautomatico y automatico; sin clave vale manual y un valor invalido aborta con la lista de validos
Comando determinista taskctl siguiente TASK-NNN que, segun estado y modo, devuelve la siguiente fase y si hay que preguntar, con tests por cada combinacion
En modo manual cada comando hace su fase y termina nombrando el comando de la siguiente, sin encadenar nada
En modo semiautomatico, al cerrar plan, approve, start y review se pregunta si seguir; un no deja la tarea en su estado y dice que comando la reanuda
En modo automatico, cerrado el plan con sus preguntas, approve, start, implementacion, review y finish se encadenan sin preguntar; la aprobacion queda registrada como automatica
review se lanza sola cuando la implementacion esta commiteada y la suite pasa, y finish se lanza sola cuando el informe aprueba; ambas se pueden forzar por comando
Ningun modo se salta las guardas: limite WIP, rama base limpia, revisor independiente, veredicto fail-closed y segunda opinion cuando revision_codex es true
Cada transicion, manual o automatica, deja un registro en tarea.md con fecha, fase, modo y quien decidio, commiteado en Git
La skill task-workflow describe los tres modos y los comandos de fase, sin mencionar rutas ni documentos internos de este repo
Test de punta a punta en repo temporal: un ciclo en modo automatico y otro en semiautomatico con un no en approve que deja la tarea en diseno
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
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **testing**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
