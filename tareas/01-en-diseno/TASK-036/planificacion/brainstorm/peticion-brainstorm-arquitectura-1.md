# Peticion de brainstorm — TASK-036, rol arquitectura (ronda 1)

- Tarea: TASK-036 — F1-T3 Veredicto con un comando e informe estructurado
- Tipo: feature · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-10-04
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
Quitar la friccion del veredicto y dejar el informe de revision legible por
una maquina (auditoria del 2026-10-03, A5 y A6). Hoy el revisor escribe la
linea `- Veredicto:` a mano, en su propio vocabulario (`**APROBADO CON
CAMBIOS**`, `**cambios-solicitados**`), y eso obliga a commits de
normalizacion; TASK-017 llego a cerrarse con un veredicto que el propio gate
rechaza. El comando `taskctl veredicto` escribe la linea canonica y la
commitea; el parser de `finish` tolera el enfasis de markdown sin aflojar la
regla («no aprobada» sigue fallando); y el scaffold del informe trae la tabla
de hallazgos que usara la ronda incremental (TASK-040).

Fuera de alcance: leer la tabla para generar la ronda 2 (TASK-040).
````

### Criterios de aceptacion

````
`taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados` sustituye la linea del informe de mayor N
El scaffold de `informe-revision-N.md` trae la tabla `| ID | Severidad | Estado | Fichero |`
El parser de `finish` acepta `**aprobada**`; `no aprobada` sigue fallando, con test
Test del comando contra un repo real
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
- Eres el unico rol que se lanza en esta tarea.
