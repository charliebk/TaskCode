# Peticion de brainstorm — TASK-099, rol arquitectura (ronda 1)

- Tarea: TASK-099 — Correccion de MENORES tras aprobar con correcciones sin abrir otra ronda completa
- Tipo: feature · Complejidad declarada: media
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
P-2 de la auditoria del 2026-11-12. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12): la medicion que se esperaba ya esta hecha (criterio 1), asi que se empieza ya; lo mas rapido posible y el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido. Lo que sigue es el enunciado original.

En modo automatico, cuando el revisor propone aprobada-con-correcciones y solo quedan MENORES, la sesion los pide como cambios-solicitados y se abre otra ronda entera para uno o dos MENORES (OpenDockTrading TASK-067 con la 0.14.0: ronda 3 por un unico MEN-4, unos 5 min y 0,37 M tokens). Se busca que los MENORES baratos se corrijan con una verificacion ligera sin ronda nueva, manteniendo que el codigo integrado es el revisado. NO se empieza hasta tener medidas al menos 10 tareas cerradas de punta a punta con la 0.14.0 en ToolsaWeb y OpenDockTrading (taskctl metricas --por-version) que confirmen que las rondas por MENORES pesan; si no pesan, se descarta. Objetivo: version 0.15.0.
````

### Criterios de aceptacion

````
plan-final.md recoge la medicion ya hecha en docs/auditoria/PASOS-PLUGIN-2026-11-12.md (71 rondas abiertas solo por MENORES en ToolsaWeb, OpenDockTrading y TaskCode, con 2 CRITICO/IMPORTANTE nuevos y 70,2 M tokens) como motivo para seguir
Con solo MENORES abiertos tras aprobada-con-correcciones, corregirlos no abre una ronda completa ni acotada nueva: queda una verificacion ligera registrada en tarea.md (test en repo temporal)
finish sigue sin integrar codigo posterior al revisado sin esa verificacion o la decision de una persona (test)
Un CRITICO o IMPORTANTE abierto sigue exigiendo cambios-solicitados y otra ronda (test)
Solo bloquean los CRITICO e IMPORTANTE: los MENORES que no se corrigen en esa verificacion ligera pasan a un backlog de la tarea (revision/menores-pendientes.md, con id, fichero y motivo) y ni abren ronda ni impiden finish (test en repo temporal)
taskctl siguiente, con solo MENORES abiertos tras aprobada-con-correcciones, no devuelve otra ronda en ningun modo, tampoco automatico, sino la verificacion ligera o finish (test)
Las skills review y task-workflow, el README y el CHANGELOG lo explican
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test (modo rapido, como dice el objetivo)
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
- Trabajan en paralelo contigo, sin verte: **riesgos**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
