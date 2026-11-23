# Peticion de brainstorm — TASK-148, rol arquitectura (ronda 1)

- Tarea: TASK-148 — Regla 4D: catalogos, config y utilidades en core
- Tipo: fix · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-23
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
Unificar los lectores de catalogos planos, la validacion de config y las utilidades repetidas de core (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CORE1-03 a CORE1-14, CORE2-08 a CORE2-10, CORE2-15 a CORE2-21).
````

### Criterios de aceptacion

````
packageRoot y CLAUDE_PLUGIN_ROOT se resuelven en un solo modulo; catalogo-skills, heuristica y doctor-deploy-catalogo comparten el lector de bloques prefijo_N_campo y describirValor
config usa masParecida para sugerir, un validador de entero en rango y otro de lista de enumerado; un test falla si CLAVES_CONFIG y el switch de claves no coinciden; SKILL_KEY_RE se deriva de los campos
Rutas relativas, fechas, solape de etiquetas, ANSI, redaccion de credenciales, URL de origin, esObjeto y recortar tienen una sola implementacion cada uno
Comentarios de config y dondeFalla ciertos; la E/S de plugin-instalado, heuristica y revisores se documenta o se mueve a fs; TRIVIAL_SIN_APROBACION se elimina o se justifica en una linea
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
